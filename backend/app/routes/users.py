"""Маршруты пользователей.

Регистрация и вход (bcrypt + JWT), профиль с талисманом, управление
пользователями из админ-панели (список / изменение / удаление / аватар).
"""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.db.models import User
from app.schemas import (
    AuthOut,
    LoginIn,
    RegisterIn,
    UserOut,
    UserUpdateIn,
)
from app.security import get_admin_user, is_admin_user
from app.utils import delete_image_by_url, save_image

router = APIRouter(tags=["Пользователи"])

@router.post("/api/register", response_model=AuthOut, status_code=201)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)) -> AuthOut:
    email = data.email.strip().lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже зарегистрирован")

    user = User(
        name=data.name.strip(),
        email=email,
        phone=data.phone.strip(),
        city=data.city,
        password_hash=hash_password(data.password),
        status="inactive",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return AuthOut(token=create_token(user.id), user=UserOut.model_validate(user))

@router.post("/api/login", response_model=AuthOut)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)) -> AuthOut:
    user = await db.scalar(select(User).where(User.email == data.email.strip().lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return AuthOut(token=create_token(user.id), user=UserOut.model_validate(user))

@router.get("/api/profile", response_model=UserOut)
async def profile(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)

@router.patch("/api/profile", response_model=UserOut)
async def update_profile(
    data: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    allowed = {"name", "phone", "city"}
    for field, value in data.model_dump(exclude_unset=True).items():
        if field in allowed:
            setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)

@router.get("/api/users", response_model=list[UserOut], dependencies=[Depends(get_admin_user)])
async def list_users(db: AsyncSession = Depends(get_db)) -> list[UserOut]:
    users = (await db.scalars(select(User).order_by(User.created_at.desc()))).all()
    return [UserOut.model_validate(user) for user in users]

@router.patch("/api/users/{user_id}", response_model=UserOut, dependencies=[Depends(get_admin_user)])
async def update_user(user_id: int, data: UserUpdateIn, db: AsyncSession = Depends(get_db)) -> UserOut:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)

@router.delete("/api/users/{user_id}", dependencies=[Depends(get_admin_user)])
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user_name = user.name
    delete_image_by_url(user.avatar_url)
    await db.delete(user)
    await db.commit()
    return {"detail": f"Пользователь «{user_name}» удалён"}

@router.post("/api/users/{user_id}/avatar", response_model=UserOut)
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(is_admin_user),
) -> UserOut:
    if current_user.id != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Можно загружать аватар только своего профиля")

    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    new_avatar = await save_image(file, prefix="avatar")
    if new_avatar is None:
        raise HTTPException(status_code=400, detail="Выберите файл изображения")

    old_avatar = user.avatar_url
    user.avatar_url = new_avatar
    delete_image_by_url(old_avatar)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)
