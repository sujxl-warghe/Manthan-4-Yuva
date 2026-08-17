from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

connect_args = {}
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Production-safe pooling for Postgres (Neon)
    engine_kwargs = {"pool_size": 5, "max_overflow": 10, "pool_pre_ping": True}

engine = create_async_engine(
    settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
