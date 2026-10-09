"""Запуск сервера разработки одной командой: python run.py.

Порт и секреты читаются из .env (по умолчанию – файл .env рядом с run.py).
Альтернативы: `npm run dev` (см. package.json) или двойной клик по start.bat.
"""
import uvicorn

from app.config import settings

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.port, reload=True)
