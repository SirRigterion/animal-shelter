"""Волонтёрство приюта.

Первая «оригинальная» функция: заявки на волонтёрство по направлениям
с модерацией. После одобрения пользователь получает бейдж волонтёра.
Вторая – журнал учёта отработанных часов с итогами по каждому волонтёру.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_optional_user
from app.db.database import get_db
from app.db.models import User, VolunteerApplication, VolunteerHours
from app.schemas import (
    VOLUNTEER_DIRECTIONS,
    VOLUNTEER_STATUS_LABELS,
    VolunteerCreateIn,
    VolunteerHoursIn,
    VolunteerHoursOut,
    VolunteerOut,
    VolunteerStatusIn,
)
from app.security import get_admin_user

router = APIRouter(prefix="/api/volunteers", tags=["Волонтёрство"])

@router.post("", response_model=VolunteerOut, status_code=201)
async def create_application(
    data: VolunteerCreateIn,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> VolunteerOut:
    if data.direction not in VOLUNTEER_DIRECTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Неизвестное направление. Допустимо: {list(VOLUNTEER_DIRECTIONS)}",
        )

    application = VolunteerApplication(
        user_id=current_user.id if current_user is not None else None,
        name=data.name.strip(),
        email=data.email.strip().lower(),
        phone=data.phone.strip(),
        city=data.city.strip(),
        direction=data.direction,
        motivation=data.motivation,
        status="new",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return VolunteerOut.model_validate(application)

@router.get("", response_model=list[VolunteerOut], dependencies=[Depends(get_admin_user)])
async def list_applications(db: AsyncSession = Depends(get_db)) -> list[VolunteerOut]:
    applications = (
        await db.scalars(select(VolunteerApplication).order_by(VolunteerApplication.created_at.desc()))
    ).all()
    return [VolunteerOut.model_validate(application) for application in applications]

@router.patch("/{application_id}", response_model=VolunteerOut, dependencies=[Depends(get_admin_user)])
async def update_application_status(
    application_id: int, data: VolunteerStatusIn, db: AsyncSession = Depends(get_db)
) -> VolunteerOut:
    if data.status not in VOLUNTEER_STATUS_LABELS:
        raise HTTPException(status_code=400, detail="Недопустимый статус заявки")

    application = await db.get(VolunteerApplication, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Заявка на волонтёрство не найдена")

    application.status = data.status
    if data.status == "approved" and application.user_id is not None:
        user = await db.get(User, application.user_id)
        if user is not None:
            user.is_volunteer = True

    await db.commit()
    await db.refresh(application)
    return VolunteerOut.model_validate(application)

@router.delete("/{application_id}", dependencies=[Depends(get_admin_user)])
async def delete_application(
    application_id: int, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    application = await db.get(VolunteerApplication, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Заявка на волонтёрство не найдена")
    await db.delete(application)
    await db.commit()
    return {"detail": f"Заявка №{application_id} удалена"}

@router.post("/hours", response_model=VolunteerHoursOut, status_code=201, dependencies=[Depends(get_admin_user)])
async def log_hours(data: VolunteerHoursIn, db: AsyncSession = Depends(get_db)) -> VolunteerHoursOut:
    user = await db.get(User, data.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    entry = VolunteerHours(
        user_id=data.user_id,
        worked_on=data.worked_on,
        hours=data.hours,
        description=data.description,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return VolunteerHoursOut(
        id=entry.id,
        user_id=entry.user_id,
        user_name=user.name,
        worked_on=entry.worked_on,
        hours=entry.hours,
        description=entry.description,
        created_at=entry.created_at,
    )

@router.get("/hours", dependencies=[Depends(get_admin_user)])
async def list_hours(db: AsyncSession = Depends(get_db)) -> dict[str, list]:
    entries_query = (
        select(VolunteerHours, User.name)
        .join(User, VolunteerHours.user_id == User.id)
        .order_by(VolunteerHours.worked_on.desc(), VolunteerHours.id.desc())
    )
    rows = (await db.execute(entries_query)).all()
    entries = [
        VolunteerHoursOut(
            id=entry.id,
            user_id=entry.user_id,
            user_name=user_name,
            worked_on=entry.worked_on,
            hours=entry.hours,
            description=entry.description,
            created_at=entry.created_at,
        )
        for entry, user_name in rows
    ]

    totals_query = (
        select(
            VolunteerHours.user_id,
            User.name,
            func.sum(VolunteerHours.hours).label("total"),
        )
        .join(User, VolunteerHours.user_id == User.id)
        .group_by(VolunteerHours.user_id, User.name)
        .order_by(func.sum(VolunteerHours.hours).desc())
    )
    totals = [
        {"user_id": user_id, "user_name": name, "total_hours": int(total or 0)}
        for user_id, name, total in (await db.execute(totals_query)).all()
    ]
    return {"entries": [entry.model_dump(mode="json") for entry in entries], "totals": totals}

@router.delete("/hours/{entry_id}", dependencies=[Depends(get_admin_user)])
async def delete_hours_entry(entry_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    entry = await db.get(VolunteerHours, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Запись о часах не найдена")
    await db.delete(entry)
    await db.commit()
    return {"detail": f"Запись №{entry_id} удалена"}
