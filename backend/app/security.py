"""Админ-доступ по JWT: токен должен принадлежать пользователю со статусом admin."""
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import get_db
from app.db.models import User

bearer_scheme = HTTPBearer(auto_error=False)

async def _user_from_token(
    credentials: HTTPAuthorizationCredentials | None,
    db: AsyncSession,
) -> User | None:
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        user_id = int(payload.get("sub", 0))
    except (jwt.PyJWTError, ValueError, TypeError):
        return None
    return await db.get(User, user_id)

async def get_admin_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await _user_from_token(credentials, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Требуется вход администратора (Bearer-токен)")
    if user.status != "admin":
        raise HTTPException(status_code=403, detail="Доступ только для администратора")
    return user

async def is_admin_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> bool:
    user = await _user_from_token(credentials, db)
    return user is not None and user.status == "admin"
