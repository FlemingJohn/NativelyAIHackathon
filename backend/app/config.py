from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    aiml_api_key: str = ""
    aiml_base_url: str = "https://api.aimlapi.com/v1"
    aiml_fast_model: str = "gpt-4o-mini"
    aiml_reasoning_model: str = "gpt-4o"

    brightdata_api_token: str = ""
    brightdata_web_unlocker_zone: str = "mcp_unlocker"

    database_url: str = "sqlite:///./app.db"


settings = Settings()
