"""Загрузка изображений: проверка, сохранение в uploads/ и удаление файлов."""
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024

async def save_image(file: UploadFile | None, prefix: str = "img") -> str | None:
    if file is None or not file.filename:
        return None
    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый формат файла. Разрешены: {allowed}",
        )
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Файл пустой")
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Файл слишком большой (максимум 5 МБ)")

    new_name = f"{prefix}_{uuid4().hex}{extension}"
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    (settings.uploads_dir / new_name).write_bytes(content)
    return f"/uploads/{new_name}"

def delete_image_by_url(url: str | None) -> None:
    if not url or not url.startswith("/uploads/"):
        return
    name = url.removeprefix("/uploads/")
    target = (settings.uploads_dir / name).resolve()
    if settings.uploads_dir.resolve() in target.parents and target.is_file():
        target.unlink()
