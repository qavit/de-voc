from __future__ import annotations

import os

import anthropic
from pydantic import BaseModel

from .base import LLMProvider, LLMResult, LLMUsage, estimate_cost

_DEFAULT_SYSTEM = "You are a German linguistics assistant. Always use the provided tool to return your answer."


class ClaudeProvider(LLMProvider):
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        self._model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    @property
    def provider_name(self) -> str:
        return "claude"

    @property
    def model(self) -> str:
        return self._model

    async def complete_structured(
        self,
        user_prompt: str,
        schema: type[BaseModel],
        system_prompt: str | None = None,
    ) -> LLMResult:
        # Use tool use with strict schema to force structured output
        tool_def = {
            "name": "respond",
            "description": "Return the structured response.",
            "input_schema": schema.model_json_schema(),
        }

        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=system_prompt or _DEFAULT_SYSTEM,
            tools=[tool_def],
            tool_choice={"type": "tool", "name": "respond"},
            messages=[{"role": "user", "content": user_prompt}],
        )

        tool_block = next(b for b in response.content if b.type == "tool_use")
        parsed = schema.model_validate(tool_block.input)

        usage = response.usage
        return LLMResult(
            data=parsed,
            usage=LLMUsage(
                provider=self.provider_name,
                model=self._model,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                cost_usd=estimate_cost(self._model, usage.input_tokens, usage.output_tokens),
            ),
        )
