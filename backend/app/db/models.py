"""ORM-модели SQLAlchemy (5 таблиц приюта «Лапа Помощи»).

Конвенции: id – первичный ключ с автоинкрементом, обязательные поля NOT NULL,
внешние ключи связывают заявки с пользователями и питомцами.
"""
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    city: Mapped[str | None] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="inactive")
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    is_volunteer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    orders: Mapped[list["Order"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    volunteer_applications: Mapped[list["VolunteerApplication"]] = relationship(
        cascade="all, delete-orphan"
    )
    volunteer_hours: Mapped[list["VolunteerHours"]] = relationship(cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} status={self.status}>"

class Pet(Base):

    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="cat")
    gender: Mapped[str] = mapped_column(String(10), nullable=False, default="male")
    age: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    breed: Mapped[str | None] = mapped_column(String(100))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Ищет дом")
    vaccinated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sterilized: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_passport: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    short_desc: Mapped[str | None] = mapped_column(String(500))
    story: Mapped[str | None] = mapped_column(Text)
    character: Mapped[list[str] | None] = mapped_column(JSON)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    orders: Mapped[list["Order"]] = relationship(
        back_populates="pet", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Pet id={self.id} name={self.name!r} status={self.status!r}>"

class Order(Base):

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    pet_id: Mapped[int] = mapped_column(
        ForeignKey("pets.id", ondelete="CASCADE"), nullable=False
    )
    phone: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    visit_date: Mapped[date | None] = mapped_column(Date)
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="На рассмотрении")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="orders")
    pet: Mapped[Pet] = relationship(back_populates="orders")

    def __repr__(self) -> str:
        return f"<Order id={self.id} user_id={self.user_id} pet_id={self.pet_id}>"

class VolunteerApplication(Base):

    __tablename__ = "volunteer_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    direction: Mapped[str] = mapped_column(String(30), nullable=False, default="walk")
    motivation: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<VolunteerApplication id={self.id} direction={self.direction!r}>"

class VolunteerHours(Base):

    __tablename__ = "volunteer_hours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    worked_on: Mapped[date] = mapped_column(Date, nullable=False)
    hours: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<VolunteerHours id={self.id} user_id={self.user_id} hours={self.hours}>"
