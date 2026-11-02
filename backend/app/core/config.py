from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "AGENTPASS"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Security & JWT
    SECRET_KEY: str = "agentpass_super_secret_signing_key_at_least_32_chars_prod_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "sqlite:///./agentpass.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str | None) -> str:
        """
        Normalize Render / Heroku postgres:// URLs to SQLAlchemy 2.0 + psycopg 3 driver format.
        """
        if not v:
            return "sqlite:///./agentpass.db"
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    # CORS Allowed Origins
    CORS_ORIGINS: list[str] = ["*"]
    FRONTEND_URL: str | None = None

    # AI Intelligence Providers
    AI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # PayPal Sandbox REST API
    PAYPAL_CLIENT_ID: str | None = None
    PAYPAL_CLIENT_SECRET: str | None = None
    PAYPAL_API_BASE: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_BASE_URL: str | None = None
    PAYPAL_WEBHOOK_ID: str | None = None

    # Redis & Background Workers
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    @model_validator(mode="after")
    def sync_aliases(self) -> "Settings":
        # Sync AI key alias
        if self.AI_API_KEY and not self.OPENAI_API_KEY:
            self.OPENAI_API_KEY = self.AI_API_KEY
        # Sync PayPal URL alias
        if self.PAYPAL_BASE_URL and self.PAYPAL_API_BASE == "https://api-m.sandbox.paypal.com":
            self.PAYPAL_API_BASE = self.PAYPAL_BASE_URL
        # Sync FRONTEND_URL to CORS
        if self.FRONTEND_URL and self.FRONTEND_URL not in self.CORS_ORIGINS:
            self.CORS_ORIGINS.append(self.FRONTEND_URL)
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
