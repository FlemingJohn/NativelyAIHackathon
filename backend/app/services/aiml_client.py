from openai import OpenAI

from app.config import settings

_client = OpenAI(base_url=settings.aiml_base_url, api_key=settings.aiml_api_key)


def chat(messages: list[dict], *, reasoning: bool = False, **kwargs) -> str:
    """Single-turn chat completion. Use reasoning=True for synthesis passes
    (idea generation, market sizing, ranking); leave False for cheap
    extraction passes."""
    model = settings.aiml_reasoning_model if reasoning else settings.aiml_fast_model
    response = _client.chat.completions.create(model=model, messages=messages, **kwargs)
    return response.choices[0].message.content or ""
