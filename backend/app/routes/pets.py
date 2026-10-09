"""CRUD питомцев + загрузка фотографий.

Просмотр каталога публичный, изменение – только по ключу администратора.
Фотография принимается формой (multipart/form-data), сохраняется в uploads/,
а её путь записывается в таблицу pets.
"""
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Pet
from app.schemas import (
    PET_GENDER_LABELS,
    PET_STATUSES,
    PET_TYPE_LABELS,
    PetOut,
)
from app.security import get_admin_user
from app.utils import delete_image_by_url, save_image

router = APIRouter(prefix="/api/pets", tags=["Питомцы"])

def _validate_choice(value: str, allowed: dict[str, str] | list[str], label: str) -> str:
    if isinstance(allowed, list):
        if value not in allowed:
            raise HTTPException(status_code=400, detail=f"{label}: допустимые значения – {allowed}")
    elif value not in allowed:
        raise HTTPException(status_code=400, detail=f"{label}: допустимые значения – {list(allowed)}")
    return value

def _parse_character(character: str | None) -> list[str] | None:
    if not character:
        return None
    items = [item.strip() for item in character.split(",") if item.strip()]
    return items or None

async def _get_pet_or_404(pet_id: int, db: AsyncSession) -> Pet:
    pet = await db.get(Pet, pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    return pet

@router.get("", response_model=list[PetOut])
async def list_pets(
    type: str | None = None,
    status: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[PetOut]:
    query = select(Pet).order_by(Pet.created_at.desc())
    if type:
        query = query.where(Pet.type == _validate_choice(type, PET_TYPE_LABELS, "type"))
    if status:
        _validate_choice(status, PET_STATUSES, "status")
        query = query.where(Pet.status == status)
    if q:
        query = query.where(or_(Pet.name.ilike(f"%{q}%"), Pet.breed.ilike(f"%{q}%")))
    pets = (await db.scalars(query)).all()
    return [PetOut.model_validate(pet) for pet in pets]

@router.get("/{pet_id}", response_model=PetOut)
async def get_pet(pet_id: int, db: AsyncSession = Depends(get_db)) -> PetOut:
    pet = await _get_pet_or_404(pet_id, db)
    return PetOut.model_validate(pet)

@router.post("", response_model=PetOut, status_code=201, dependencies=[Depends(get_admin_user)])
async def create_pet(
    name: str = Form(...),
    type: str = Form("cat"),
    gender: str = Form("male"),
    age: str = Form(""),
    breed: str | None = Form(None),
    status: str = Form("Ищет дом"),
    vaccinated: bool = Form(False),
    sterilized: bool = Form(False),
    has_passport: bool = Form(False),
    short_desc: str | None = Form(None),
    story: str | None = Form(None),
    character: str | None = Form(None),
    description: str | None = Form(None),
    photo: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
) -> PetOut:
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Имя питомца обязательно")
    _validate_choice(type, PET_TYPE_LABELS, "type")
    _validate_choice(gender, PET_GENDER_LABELS, "gender")
    _validate_choice(status, PET_STATUSES, "status")

    photo_url = await save_image(photo, prefix="pet")
    if photo_url is None and photo is not None:
        raise HTTPException(status_code=400, detail="Выберите файл изображения")
    pet = Pet(
        name=name,
        type=type,
        gender=gender,
        age=age.strip(),
        breed=breed.strip() if breed else None,
        status=status,
        vaccinated=vaccinated,
        sterilized=sterilized,
        has_passport=has_passport,
        short_desc=short_desc,
        story=story,
        character=_parse_character(character),
        description=description,
        photo_url=photo_url,
    )
    db.add(pet)
    await db.commit()
    await db.refresh(pet)
    return PetOut.model_validate(pet)

@router.patch("/{pet_id}", response_model=PetOut, dependencies=[Depends(get_admin_user)])
async def update_pet(
    pet_id: int,
    name: str | None = Form(None),
    type: str | None = Form(None),
    gender: str | None = Form(None),
    age: str | None = Form(None),
    breed: str | None = Form(None),
    status: str | None = Form(None),
    vaccinated: bool | None = Form(None),
    sterilized: bool | None = Form(None),
    has_passport: bool | None = Form(None),
    short_desc: str | None = Form(None),
    story: str | None = Form(None),
    character: str | None = Form(None),
    description: str | None = Form(None),
    photo: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
) -> PetOut:
    pet = await _get_pet_or_404(pet_id, db)

    fields: dict[str, Any] = {
        "name": name,
        "type": type,
        "gender": gender,
        "age": age,
        "breed": breed,
        "status": status,
        "vaccinated": vaccinated,
        "sterilized": sterilized,
        "has_passport": has_passport,
        "short_desc": short_desc,
        "story": story,
        "description": description,
    }
    for field, value in fields.items():
        if value is None:
            continue
        if field == "type":
            _validate_choice(value, PET_TYPE_LABELS, field)
        if field == "gender":
            _validate_choice(value, PET_GENDER_LABELS, field)
        if field == "status":
            _validate_choice(value, PET_STATUSES, field)
        setattr(pet, field, value)

    if character is not None:
        pet.character = _parse_character(character)

    if photo is not None and photo.filename:
        new_photo = await save_image(photo, prefix="pet")
        if new_photo is not None:
            old_photo = pet.photo_url
            pet.photo_url = new_photo
            delete_image_by_url(old_photo)

    await db.commit()
    await db.refresh(pet)
    return PetOut.model_validate(pet)

@router.delete("/{pet_id}", dependencies=[Depends(get_admin_user)])
async def delete_pet(pet_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    pet = await _get_pet_or_404(pet_id, db)
    pet_name = pet.name
    delete_image_by_url(pet.photo_url)
    await db.delete(pet)
    await db.commit()
    return {"detail": f"Питомец «{pet_name}» удалён"}
