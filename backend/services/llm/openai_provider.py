from __future__ import annotations

import json
import os

from openai import AsyncOpenAI
from pydantic import BaseModel

from .base import LLMProvider, LLMResult, LLMUsage, estimate_cost


class OpenAIProvider(LLMProvider):
    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self._model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model(self) -> str:
        return self._model

    async def complete_structured(
        self,
        user_prompt: str,
        schema: type[BaseModel],
        system_prompt: str | None = None,
    ) -> LLMResult:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})

        response = await self._client.responses.parse(
            model=self._model,
            input=messages,
            text_format=schema,
        )

        parsed = response.output_parsed
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
