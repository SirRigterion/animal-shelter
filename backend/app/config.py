"""Настройки приложения.

Все секретные значения (порт, ключ администратора, подключение к БД) читаются
из файла .env рядом с backend/ – в коде они не «зашиты» намертво.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:

    def __init__(self) -> None:
        self.port: int = int(os.getenv("PORT", "8000"))
        self.admin_email: str = os.getenv("ADMIN_EMAIL", "admin@shelter.local")
        self.admin_password: str = os.getenv("ADMIN_PASSWORD", "admin123")
        self.database_url: str = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://shelter:shelter@localhost:5432/animal_shelter",
        )
        self.jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
        self.jwt_expires_days: int = int(os.getenv("JWT_EXPIRES_DAYS", "7"))
        # Разрешённые источники для CORS (через запятую). В Docker фронтенд и API
        # работают с одного домена, поэтому CORS нужен только для локальной разработки.
        self.cors_origins: list[str] = [
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
            ).split(",")
            if origin.strip()
        ]
        self.uploads_dir: Path = BASE_DIR / "uploads"
        self.admin_dir: Path = BASE_DIR / "admin"

settings = Settings()
