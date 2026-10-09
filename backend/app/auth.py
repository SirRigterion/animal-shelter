"""Аутентификация: хэширование паролей bcrypt + JWT-токены.

Пароли в базе хранятся только в виде bcrypt-хэша. При входе проверяем
совпадение хэшей, затем выдаём JWT-токен, который React-фронтенд
будет отправлять в заголовке Authorization: Bearer <token>.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import get_db
from app.db.models import User

bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_expires_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def _user_id_from_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return int(payload.get("sub", 0))
    except (jwt.PyJWTError, ValueError, TypeError):
        return None

async def _load_user_by_token(
    token: str, db: AsyncSession
) -> User | None:
    user_id = _user_id_from_token(token)
    if user_id is None:
        return None
    return await db.get(User, user_id)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Требуется авторизация (Bearer-токен)")
    user = await _load_user_by_token(credentials.credentials, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Недействительный или устаревший токен")
    return user

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    return await _load_user_by_token(credentials.credentials, db)
