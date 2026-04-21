from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Pricing table (USD per 1M tokens, as of 2025-04)
# Update when providers change pricing.
# ---------------------------------------------------------------------------
PRICING: dict[str, dict[str, float]] = {
    "gpt-4o-mini":                    {"input": 0.15,  "output": 0.60},
    "gemini-2.0-flash":               {"input": 0.075, "output": 0.30},
    "claude-3-5-sonnet-20241022":     {"input": 3.00,  "output": 15.00},
}


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    price = PRICING.get(model, {"input": 0.0, "output": 0.0})
    return (input_tokens * price["input"] + output_tokens * price["output"]) / 1_000_000


@dataclass
class LLMUsage:
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float


@dataclass
class LLMResult:
    data: Any          # parsed Pydantic model instance
    usage: LLMUsage


class LLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str: ...

    @property
    @abstractmethod
    def model(self) -> str: ...

    @abstractmethod
    async def complete_structured(
        self,
        user_prompt: str,
        schema: type[BaseModel],
        system_prompt: str | None = None,
    ) -> LLMResult: ...
