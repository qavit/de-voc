from __future__ import annotations

import os

from google import genai
from google.genai import types
from pydantic import BaseModel

from .base import LLMProvider, LLMResult, LLMUsage, estimate_cost


class GeminiProvider(LLMProvider):
    def __init__(self) -> None:
        self._client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        self._model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model(self) -> str:
        return self._model

    async def complete_structured(
        self,
        user_prompt: str,
        schema: type[BaseModel],
        system_prompt: str | None = None,
    ) -> LLMResult:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            system_instruction=system_prompt,
        )

        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=user_prompt,
            config=config,
        )

        parsed = schema.model_validate_json(response.text)
        meta = response.usage_metadata

        return LLMResult(
            data=parsed,
            usage=LLMUsage(
                provider=self.provider_name,
                model=self._model,
                input_tokens=meta.prompt_token_count or 0,
                output_tokens=meta.candidates_token_count or 0,
                cost_usd=estimate_cost(
                    self._model,
                    meta.prompt_token_count or 0,
                    meta.candidates_token_count or 0,
                ),
            ),
        )
