from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

from .base import LLMProvider, LLMResult, LLMUsage  # noqa: E402


def get_llm_provider() -> LLMProvider:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    match provider:
        case "openai":
            from .openai_provider import OpenAIProvider
            return OpenAIProvider()
        case "gemini":
            from .gemini_provider import GeminiProvider
            return GeminiProvider()
        case "claude":
            from .claude_provider import ClaudeProvider
            return ClaudeProvider()
        case _:
            raise ValueError(f"Unknown LLM_PROVIDER: {provider!r}. Choose from: openai, gemini, claude")


__all__ = ["get_llm_provider", "LLMProvider", "LLMResult", "LLMUsage"]
