from __future__ import annotations
import os
from typing import Protocol
from app.core.config import get_settings


class ProviderResponse(dict):
    pass


class ProviderClient(Protocol):
    def complete(self, *, model: str, system_prompt: str, user_prompt: str) -> ProviderResponse: ...


class MockProvider:
    def complete(self, *, model: str, system_prompt: str, user_prompt: str) -> ProviderResponse:
        text = (
            f"[MOCK:{model}] He procesado tu solicitud. "
            f"Resumen comercial: {user_prompt[:220]}"
        )
        return ProviderResponse(
            text=text,
            usage={"input_tokens": max(1, len(user_prompt) // 4), "output_tokens": max(1, len(text) // 4)},
            cost_usd=0.0025,
        )


class OpenAIProvider:
    def __init__(self):
        from openai import OpenAI
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)

    def complete(self, *, model: str, system_prompt: str, user_prompt: str) -> ProviderResponse:
        response = self.client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        text = getattr(response, "output_text", "") or ""
        usage = getattr(response, "usage", None)
        input_tokens = getattr(usage, "input_tokens", 0) if usage else 0
        output_tokens = getattr(usage, "output_tokens", 0) if usage else 0
        return ProviderResponse(
            text=text,
            usage={"input_tokens": input_tokens, "output_tokens": output_tokens},
            cost_usd=0.0,
        )


class AnthropicProvider:
    def __init__(self):
        import anthropic
        settings = get_settings()
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def complete(self, *, model: str, system_prompt: str, user_prompt: str) -> ProviderResponse:
        response = self.client.messages.create(
            model=model,
            max_tokens=1200,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        parts = []
        for block in response.content:
            text = getattr(block, "text", None)
            if text:
                parts.append(text)
        input_tokens = getattr(response.usage, "input_tokens", 0)
        output_tokens = getattr(response.usage, "output_tokens", 0)
        return ProviderResponse(
            text="\n".join(parts),
            usage={"input_tokens": input_tokens, "output_tokens": output_tokens},
            cost_usd=0.0,
        )


class GroqProvider:
    def __init__(self):
        from groq import Groq
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)

    def complete(self, *, model: str, system_prompt: str, user_prompt: str) -> ProviderResponse:
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        text = response.choices[0].message.content or ""
        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
        completion_tokens = getattr(usage, "completion_tokens", 0) if usage else 0
        return ProviderResponse(
            text=text,
            usage={"input_tokens": prompt_tokens, "output_tokens": completion_tokens},
            cost_usd=0.0,
        )


def get_provider(provider: str) -> ProviderClient:
    settings = get_settings()
    provider = provider.lower()
    if provider == "openai" and settings.openai_api_key:
        return OpenAIProvider()
    if provider == "anthropic" and settings.anthropic_api_key:
        return AnthropicProvider()
    if provider == "groq" and settings.groq_api_key:
        return GroqProvider()
    return MockProvider()
