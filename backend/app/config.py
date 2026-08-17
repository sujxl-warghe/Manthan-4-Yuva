import os
from pydantic_settings import BaseSettings


def _normalize_database_url(url: str) -> str:
    """Make hosting-provider connection strings work with async SQLAlchemy.

    Render, Railway, Neon, Supabase, etc. hand out URLs starting with
    `postgres://` or `postgresql://` (the sync psycopg2 scheme, sometimes
    with a `?sslmode=require` query param). This rewrites them to the
    asyncpg scheme/param so DATABASE_URL can be pasted in as-is without any
    manual editing.
    """
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    if url.startswith("postgresql+asyncpg://"):
        # asyncpg doesn't understand sslmode=require; it wants ssl=require.
        url = url.replace("sslmode=require", "ssl=require")

    return url


class Settings(BaseSettings):
    APP_NAME: str = "VrukshaSetu API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Default: local SQLite for prototype/dev.
    # In production, set DATABASE_URL to a Postgres connection string
    # (Neon, Render Postgres, Railway Postgres, Supabase, etc.) — any of
    # these schemes work as-is: postgres://, postgresql://,
    # postgresql+asyncpg://
    DATABASE_URL: str = _normalize_database_url(
        os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./vrukshasetu.db")
    )

    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production-vrukshasetu")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
