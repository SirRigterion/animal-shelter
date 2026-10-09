"""Маршруты для админ-панели: сводная статистика и галерея изображений."""
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import create_token, verify_password
from app.config import settings
from app.db.database import get_db
from app.db.models import Order, Pet, User, VolunteerApplication, VolunteerHours
from app.schemas import ORDER_STATUSES, PET_STATUSES, AdminLoginIn, OrderOut, UserOut
from app.security import get_admin_user
from app.utils import ALLOWED_EXTENSIONS, save_image

router = APIRouter(prefix="/api/admin", tags=["Админ-панель"])

@router.post("/login")
async def admin_login(data: AdminLoginIn, db: AsyncSession = Depends(get_db)) -> dict:
    user = await db.scalar(select(User).where(User.email == data.email.strip().lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if user.status != "admin":
        raise HTTPException(status_code=403, detail="Аккаунт не является администратором")
    return {"token": create_token(user.id), "user": UserOut.model_validate(user)}

@router.get("/stats", dependencies=[Depends(get_admin_user)])
async def stats(db: AsyncSession = Depends(get_db)) -> dict:
    users_by_status = dict(
        (await db.execute(select(User.status, func.count()).group_by(User.status))).all()
    )
    pets_by_status = dict(
        (await db.execute(select(Pet.status, func.count()).group_by(Pet.status))).all()
    )
    orders_by_status = dict(
        (await db.execute(select(Order.status, func.count()).group_by(Order.status))).all()
    )
    apps_by_status = dict(
        (
            await db.execute(
                select(VolunteerApplication.status, func.count()).group_by(VolunteerApplication.status)
            )
        ).all()
    )

    volunteers_count = await db.scalar(
        select(func.count()).select_from(User).where(User.is_volunteer.is_(True))
    )
    hours_total = await db.scalar(select(func.sum(VolunteerHours.hours)))
    users_total = await db.scalar(select(func.count()).select_from(User))
    pets_total = await db.scalar(select(func.count()).select_from(Pet))
    orders_total = await db.scalar(select(func.count()).select_from(Order))
    apps_total = await db.scalar(select(func.count()).select_from(VolunteerApplication))

    recent_orders = (
        await db.scalars(
            select(Order)
            .options(selectinload(Order.user), selectinload(Order.pet))
            .order_by(Order.created_at.desc())
            .limit(5)
        )
    ).all()

    uploads_count = len(
        [
            item
            for item in settings.uploads_dir.glob("*")
            if item.is_file() and item.suffix.lower() in ALLOWED_EXTENSIONS
        ]
    )

    return jsonable_encoder(
        {
            "users": {
                "total": int(users_total or 0),
                "by_status": users_by_status,
                "volunteers": int(volunteers_count or 0),
            },
            "pets": {"total": int(pets_total or 0), "by_status": pets_by_status},
            "orders": {
                "total": int(orders_total or 0),
                "by_status": orders_by_status,
                "recent": [
                    OrderOut(
                        id=order.id,
                        user_id=order.user_id,
                        user_name=order.user.name if order.user else "",
                        pet_id=order.pet_id,
                        pet_name=order.pet.name if order.pet else "",
                        pet_type=order.pet.type if order.pet else None,
                        pet_photo_url=order.pet.photo_url if order.pet else None,
                        phone=order.phone,
                        visit_date=order.visit_date,
                        comment=order.comment,
                        status=order.status,
                        created_at=order.created_at,
                    )
                    for order in recent_orders
                ],
            },
            "volunteers": {
                "applications_total": int(apps_total or 0),
                "applications_by_status": apps_by_status,
                "hours_total": int(hours_total or 0),
            },
            "uploads_count": uploads_count,
            "order_statuses": ORDER_STATUSES,
            "pet_statuses": PET_STATUSES,
        }
    )

@router.get("/uploads", dependencies=[Depends(get_admin_user)])
async def list_uploads() -> list[dict]:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    files = [
        item
        for item in settings.uploads_dir.glob("*")
        if item.is_file() and item.suffix.lower() in ALLOWED_EXTENSIONS
    ]
    return [
        {"filename": item.name, "url": f"/uploads/{item.name}", "size": item.stat().st_size}
        for item in sorted(files, key=lambda item: item.stat().st_mtime, reverse=True)
    ]

@router.post("/uploads", status_code=201, dependencies=[Depends(get_admin_user)])
async def upload_image(file: UploadFile = File(...)) -> dict:
    url = await save_image(file, prefix="gallery")
    if url is None:
        raise HTTPException(status_code=400, detail="Выберите файл изображения")
    return {"url": url, "filename": url.removeprefix("/uploads/")}

@router.delete("/uploads/{filename}", dependencies=[Depends(get_admin_user)])
async def delete_upload(filename: str, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    if Path(filename).name != filename:
        raise HTTPException(status_code=400, detail="Недопустимое имя файла")
    target = settings.uploads_dir / filename
    if not target.is_file():
        raise HTTPException(status_code=404, detail="Файл не найден")

    url = f"/uploads/{filename}"
    await db.execute(update(Pet).where(Pet.photo_url == url).values(photo_url=None))
    await db.execute(update(User).where(User.avatar_url == url).values(avatar_url=None))
    await db.commit()

    target.unlink()
    return {"detail": f"Изображение {filename} удалено", "filename": filename}
