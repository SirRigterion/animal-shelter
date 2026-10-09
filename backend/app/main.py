"""Точка входа FastAPI: маршруты, CORS, статика, обработка ошибок.

Запуск: python run.py (порт читается из .env, по умолчанию 8000).
Документация API: /docs, админ-панель: /admin/.
"""
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.db.database import engine
from app.routes import admin, orders, pets, users, volunteers

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        host_part = settings.database_url.split("@")[-1]
        print(f"[startup] База данных доступна: {host_part}")
    except Exception as error:
        print(f"[startup] ВНИМАНИЕ: не удалось подключиться к базе данных: {error}")
        print("[startup] Выполните настройку командой: python setup_db.py")
    print(
        f"[startup] Сервер запущен: http://127.0.0.1:{settings.port} "
        f"| Админ-панель: http://127.0.0.1:{settings.port}/admin/ "
        f"| Документация: http://127.0.0.1:{settings.port}/docs"
    )
    yield
    await engine.dispose()

app = FastAPI(
    title="Лапа Помощи – API приюта",
    description="Backend сайта приюта животных: пользователи, питомцы, заявки, волонтёрство, изображения.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(pets.router)
app.include_router(orders.router)
app.include_router(volunteers.router)
app.include_router(admin.router)

@app.get("/", tags=["Служебные"])
async def root() -> dict[str, str]:
    return {
        "name": "Лапа Помощи – API",
        "docs": "/docs",
        "admin": "/admin/",
        "status": "ok",
    }

@app.get("/admin", include_in_schema=False)
async def admin_redirect():
    return RedirectResponse("/admin/")

@app.get("/admin/", include_in_schema=False)
async def admin_index():
    return FileResponse(
        settings.admin_dir / "index.html",
        media_type="text/html",
        headers={"Cache-Control": "no-cache"},
    )

settings.uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")
app.mount("/admin", StaticFiles(directory=settings.admin_dir, html=True), name="admin")

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"detail": "Ошибка валидации данных", "errors": jsonable_encoder(exc.errors())},
    )

@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": "Внутренняя ошибка сервера"})
