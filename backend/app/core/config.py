from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "AGENTPASS"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security & JWT
    SECRET_KEY: str = "agentpass_development_secret_key_98234789123479123847129834"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "sqlite:///./agentpass.db"

    # AI Intelligence Providers
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # PayPal Sandbox REST API
    PAYPAL_CLIENT_ID: str | None = None
    PAYPAL_CLIENT_SECRET: str | None = None
    PAYPAL_API_BASE: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_WEBHOOK_ID: str | None = None

    # Redis & Background Workers
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
