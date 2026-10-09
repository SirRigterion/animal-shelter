"""Настройка базы данных PostgreSQL для проекта «Лапа Помощи».

Одна команда делает всё:
  1. Спрашивает пароль суперпользователя postgres (скрытый ввод, нигде не сохраняется)
  2. Создаёт роль `shelter` и базу `animal_shelter` (если их ещё нет)
  3. Записывает DATABASE_URL в .env
  4. Применяет миграции Alembic (alembic upgrade head)

Флаги:
  --seed   – после миграций запустить seed.py (администратор + демо-питомцы)
  --drop   – удалить базу animal_shelter (полезно для чистого пересоздания)

Пароль postgres можно передать и без интерактива – переменной окружения:
  POSTGRES_PASSWORD=... python setup_db.py."""
  
import argparse
import asyncio
import getpass
import os
import subprocess
import sys
from pathlib import Path
import asyncpg


BASE_DIR = Path(__file__).resolve().parent
DB_NAME = "animal_shelter"
DB_USER = "shelter"
DB_PASSWORD = "shelter"


async def ensure_role_and_database(pg_password: str) -> None:
    connection = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password=pg_password,
        database="postgres",
    )
    try:
        role_exists = await connection.fetchval(
            "SELECT 1 FROM pg_roles WHERE rolname = $1",
            DB_USER,
        )
        if role_exists is None:
            await connection.execute(
                f"CREATE ROLE {DB_USER} LOGIN PASSWORD '{DB_PASSWORD}'"
            )
            print(f"[setup] Создана роль {DB_USER}")
        else:
            print(f"[setup] Роль {DB_USER} уже существует")

        db_exists = await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", DB_NAME
        )
        if db_exists is None:
            await connection.execute(f"CREATE DATABASE {DB_NAME} OWNER {DB_USER}")
            print(f"[setup] Создана база {DB_NAME}")
        else:
            print(f"[setup] База {DB_NAME} уже существует")
    finally:
        await connection.close()

async def drop_database(pg_password: str) -> None:
    connection = await asyncpg.connect(
        host="localhost", port=5432, user="postgres",
        password=pg_password, database="postgres",
    )
    try:
        await connection.execute(f'DROP DATABASE IF EXISTS {DB_NAME} WITH (FORCE)')
        print(f"[setup] База {DB_NAME} удалена")
    finally:
        await connection.close()


def update_env_database_url() -> str:
    database_url = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@localhost:5432/{DB_NAME}"
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        example = BASE_DIR / ".env.example"
        if example.exists():
            env_path.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
            print("[setup] Файл .env создан из .env.example")

    lines = env_path.read_text(encoding="utf-8").splitlines()
    found = False
    for index, line in enumerate(lines):
        if line.startswith("DATABASE_URL="):
            lines[index] = f"DATABASE_URL={database_url}"
            found = True
            break
    if not found:
        lines.append(f"DATABASE_URL={database_url}")
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[setup] DATABASE_URL записан в .env: {database_url}")
    return database_url


def run_migrations() -> None:
    print("[setup] Применяю миграции Alembic...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BASE_DIR,
        check=False,
    )
    if result.returncode != 0:
        print("[setup] ОШИБКА: миграции не применились. Проверьте подключение к PostgreSQL.")
        sys.exit(1)


def run_seed() -> None:
    print("[setup] Заполняю базу демо-данными...")
    result = subprocess.run([sys.executable, "seed.py"], cwd=BASE_DIR, check=False)
    if result.returncode != 0:
        print("[setup] ОШИБКА: не удалось создать демо-данные.")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Настройка БД «Лапа Помощи»")
    parser.add_argument("--seed", action="store_true", help="создать демо-данные")
    parser.add_argument("--drop", action="store_true", help="сначала удалить базу")
    args = parser.parse_args()

    pg_password = os.getenv("POSTGRES_PASSWORD") or getpass.getpass("Пароль суперпользователя postgres: ")
    if not pg_password:
        print("[setup] Пароль не введён – остановка.")
        sys.exit(1)

    try:
        if args.drop:
            asyncio.run(drop_database(pg_password))
        asyncio.run(ensure_role_and_database(pg_password))
    except asyncpg.InvalidPasswordError:
        print("[setup] ОШИБКА: неверный пароль postgres. Попробуйте ещё раз.")
        sys.exit(1)
    except ConnectionError as error:
        print(f"[setup] ОШИБКА: не удалось подключиться к PostgreSQL (localhost:5432): {error}")
        sys.exit(1)

    update_env_database_url()
    run_migrations()

    if args.seed:
        run_seed()

    print("[setup] Готово! Запускайте сервер: python run.py")


if __name__ == "__main__":
    main()
