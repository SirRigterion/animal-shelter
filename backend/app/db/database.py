"""Подключение к PostgreSQL: асинхронный движок SQLAlchemy и фабрика сессий.

Все запросы приложения выполняются через SQLAlchemy ORM – то есть всегда
параметризованные (подготовленные) запросы, без склеивания строк SQL.
"""
import json
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    json_serializer=lambda value: json.dumps(value, ensure_ascii=False),
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
