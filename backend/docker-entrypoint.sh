#!/bin/sh
# Запуск backend в контейнере:
#   1) ждём, пока PostgreSQL станет доступен;
#   2) применяем миграции Alembic;
#   3) (по желанию, RUN_SEED=true) создаём администратора и демо-питомцев – seed идемпотентный;
#   4) запускаем сервер.
set -e

python - <<'PY'
import asyncio, os, sys, time
import asyncpg

url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")

async def main():
    for attempt in range(1, 31):
        try:
            conn = await asyncpg.connect(url, timeout=3)
            await conn.close()
            print("[entrypoint] PostgreSQL доступен")
            return
        except Exception as error:
            print(f"[entrypoint] Жду PostgreSQL ({attempt}/30): {error}")
            time.sleep(2)
    sys.exit("[entrypoint] PostgreSQL не отвечает – остановка")

asyncio.run(main())
PY

echo "[entrypoint] Применяю миграции..."
alembic upgrade head

if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "[entrypoint] Запускаю seed.py (администратор + демо-питомцы)..."
    python seed.py
fi

exec "$@"
