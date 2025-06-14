from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings."""
    PROJECT_NAME: str = "ChitChat AI"
    PROJECT_VERSION: str = "0.1.0"

    # Database settings
    DATABASE_URL: str = "sqlite:///./chitchat_ai.db"

    # JWT settings
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # Replace with a securely generated key in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Gemini API settings
    GEMINI_API_KEY: Optional[str] = None # Should be set in .env or environment variables
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash-preview-0514" # Updated model name as per batch instruction
    GEMINI_BOT_EMAIL_ID: str = "gemini@bot.chitchat" # A dummy email for the bot user if needed

    # API prefix
    API_V1_STR: str = "/api/v1" # This might be used for OpenAPI URL or future versioning

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
