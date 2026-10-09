"""Заявки на знакомство с питомцем (orders): CRUD + смена статуса встречи.

Пользователь создаёт заявку по своему токену и видит свои;
администратор (по ключу X-Admin-Key) видит все и меняет статусы.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user, get_optional_user
from app.db.database import get_db
from app.db.models import Order, Pet, User
from app.schemas import ORDER_STATUSES, OrderCreateIn, OrderOut, OrderStatusIn
from app.security import get_admin_user, is_admin_user

router = APIRouter(prefix="/api/orders", tags=["Заявки на знакомство"])

def order_to_out(order: Order) -> OrderOut:
    user = order.user
    pet = order.pet
    return OrderOut(
        id=order.id,
        user_id=order.user_id,
        user_name=user.name if user is not None else "",
        pet_id=order.pet_id,
        pet_name=pet.name if pet is not None else "",
        pet_type=pet.type if pet is not None else None,
        pet_photo_url=pet.photo_url if pet is not None else None,
        phone=order.phone,
        visit_date=order.visit_date,
        comment=order.comment,
        status=order.status,
        created_at=order.created_at,
    )

async def _get_order_with_relations(order_id: int, db: AsyncSession) -> Order | None:
    query = (
        select(Order)
        .options(selectinload(Order.user), selectinload(Order.pet))
        .where(Order.id == order_id)
    )
    return await db.scalar(query)

@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    data: OrderCreateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    pet = await db.get(Pet, data.pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Питомец не найден")

    order = Order(
        user_id=current_user.id,
        pet_id=pet.id,
        phone=data.phone.strip(),
        visit_date=data.visit_date,
        comment=data.comment,
        status="На рассмотрении",
    )
    db.add(order)
    await db.commit()
    order.user = current_user
    order.pet = pet
    return order_to_out(order)

@router.get("", response_model=list[OrderOut])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(is_admin_user),
    current_user: User | None = Depends(get_optional_user),
) -> list[OrderOut]:
    query = (
        select(Order)
        .options(selectinload(Order.user), selectinload(Order.pet))
        .order_by(Order.created_at.desc())
    )
    if not is_admin:
        if current_user is None:
            raise HTTPException(
                status_code=401,
                detail="Нужен Bearer-токен пользователя или ключ администратора",
            )
        query = query.where(Order.user_id == current_user.id)

    orders = (await db.scalars(query)).all()
    return [order_to_out(order) for order in orders]

@router.patch("/{order_id}", response_model=OrderOut, dependencies=[Depends(get_admin_user)])
async def update_order_status(
    order_id: int, data: OrderStatusIn, db: AsyncSession = Depends(get_db)
) -> OrderOut:
    if data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Недопустимый статус. Допустимо: {ORDER_STATUSES}")

    order = await _get_order_with_relations(order_id, db)
    if order is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    order.status = data.status
    await db.commit()
    return order_to_out(order)

@router.delete("/{order_id}", dependencies=[Depends(get_admin_user)])
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    order = await _get_order_with_relations(order_id, db)
    if order is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    await db.delete(order)
    await db.commit()
    return {"detail": f"Заявка №{order_id} удалена"}
