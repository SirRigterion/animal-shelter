"""Создание демо-данных: администратор (из .env) и 8 питомцев сайта с фотографиями.

Запускать после setup_db.py и миграций:
    python seed.py
Пароль postgres не нужен – подключение идёт уже от роли shelter.
"""
import asyncio
import shutil
from pathlib import Path

from sqlalchemy import delete, func, select

from app.auth import hash_password
from app.config import settings
from app.db.database import AsyncSessionLocal
from app.db.models import Order, Pet, User

FRONTEND_ASSETS = Path(__file__).resolve().parent.parent / "frontend" / "src" / "assets" / "pets"

ORIGINAL_PETS: list[dict] = [
    {
        "image": "cat1.png",
        "name": "Барсик", "type": "cat", "gender": "male", "age": "~1.5 года",
        "breed": "Европейская короткошёрстная", "status": "Ищет дом",
        "vaccinated": False, "sterilized": False, "has_passport": False,
        "character": ["Спокойный", "Мурчащий", "Приучен к лотку"],
        "short_desc": "Невероятно ласковый зеленоглазый кот, обожающий дремать на коленях.",
        "story": "Барсика нашли на дачных участках поздней осенью. Он был напуган, но сразу потянулся к волонтёрам. Сейчас он полностью здоров и готов подарить всё своё тепло заботливой семье.",
    },
    {
        "image": "dog1.png",
        "name": "Рекс", "type": "dog", "gender": "male", "age": "2 года",
        "breed": "Метис овчарки", "status": "Ищет дом",
        "vaccinated": True, "sterilized": True, "has_passport": True,
        "character": ["Преданный", "Обучаемый", "Любит активные прогулки"],
        "short_desc": "Энергичный, умный и верный защитник, знающий базовые команды.",
        "story": "Рекс попал в приют совсем молодым псом. Он очень любознателен, отлично ходит на поводке и с радостью разучивает новые трюки. Будет идеальным компаньоном для активных людей.",
    },
    {
        "image": "cat2.png",
        "name": "Луна", "type": "cat", "gender": "female", "age": "5 месяцев",
        "breed": "Метис сиамской", "status": "Ищет дом",
        "vaccinated": True, "sterilized": False, "has_passport": True,
        "character": ["Игривая", "Любопытная", "Дружит с кошками"],
        "short_desc": "Очаровательный котёнок с выразительными глазами и весёлым нравом.",
        "story": "Луну вместе с братиками спасли из подвала жилого дома. Малышка подросла, окрепла и теперь превратилась в маленькую пушистую исследовательницу, готовую играть с бантиками часами.",
    },
    {
        "image": "dog2.png",
        "name": "Бим", "type": "dog", "gender": "male", "age": "4 месяца",
        "breed": "Метис ретривера", "status": "Ищет дом",
        "vaccinated": True, "sterilized": False, "has_passport": True,
        "character": ["Дружелюбный", "Ласковый", "Любит детей"],
        "short_desc": "Милый и общительный щенок с золотым характером и добрым взглядом.",
        "story": "Бим родился у бездомной собаки, которую волонтеры забрали на передержку. Малыш обожает людей, быстро социализируется и станет самым преданным другом для всей семьи.",
    },
    {
        "image": "cat3.png",
        "name": "Мия", "type": "cat", "gender": "female", "age": "3 года",
        "breed": "Британская короткошёрстная (метис)", "status": "Ищет дом",
        "vaccinated": True, "sterilized": True, "has_passport": True,
        "character": ["Аристократичная", "Ненавязчивая", "Аккуратная"],
        "short_desc": "Грациозная кошечка с бархатной шерсткой, ценит уют и покой в доме.",
        "story": "Хозяева Мии уехали в другую страну и не смогли взять её с собой. Кошечка первое время грустила, но сейчас вновь раскрывается и готова доверять новым любящим людям.",
    },
    {
        "image": "dog3.png",
        "name": "Арчи", "type": "dog", "gender": "male", "age": "4 года",
        "breed": "Метис корги", "status": "На передержке",
        "vaccinated": True, "sterilized": True, "has_passport": True,
        "character": ["Жизнерадостный", "Компанейский", "Улыбчивый"],
        "short_desc": "Коротколапый пушистый позитивчик, заряжающий хорошим настроением.",
        "story": "Арчи обожает улыбаться и приносить мячик. Он прекрасно ладит с другими собаками и всегда радуется новым знакомствам. В данный момент живёт у временного волонтёра.",
    },
    {
        "image": "cat4.png",
        "name": "Снежинка", "type": "cat", "gender": "female", "age": "1 год",
        "breed": "Ангорская (метис)", "status": "На передержке",
        "vaccinated": True, "sterilized": True, "has_passport": True,
        "character": ["Нежная", "Тихая", "Чуткая"],
        "short_desc": "Белоснежная красавица с шелковистой шерстью и добрым сердечком.",
        "story": "Снежинка попала в приют после того, как её спасли из холодного подъезда. Она быстро привыкла к регулярной ласке и ищет тихий дом, где её будут любить и баловать.",
    },
    {
        "image": "dog4.png",
        "name": "Джек", "type": "dog", "gender": "male", "age": "1 год",
        "breed": "Джек-рассел терьер (метис)", "status": "Ищет дом",
        "vaccinated": True, "sterilized": True, "has_passport": True,
        "character": ["Неутомимый", "Любознательный", "Прекрасный компаньон"],
        "short_desc": "Весёлый хвостик, с которым никогда не соскучишься на пробежке.",
        "story": "Джек – сгусток энергии и оптимизма! Обожает бегать за палочкой, исследовать парки и засыпать в обнимку после долгой интересной прогулки.",
    },
]

def copy_pet_images() -> None:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    for pet in ORIGINAL_PETS:
        source = FRONTEND_ASSETS / pet["image"]
        target = settings.uploads_dir / f"pet_{pet['image']}"
        if source.is_file() and not target.exists():
            shutil.copyfile(source, target)

async def seed() -> None:
    copy_pet_images()

    async with AsyncSessionLocal() as session:
        admin_email = settings.admin_email.strip().lower()
        admin_exists = await session.scalar(select(User).where(User.email == admin_email))
        if admin_exists is None:
            session.add(
                User(
                    name="Главный администратор",
                    email=admin_email,
                    phone="+7 000 000-00-00",
                    password_hash=hash_password(settings.admin_password),
                    status="admin",
                )
            )
            print(f"[seed] Создан администратор {admin_email} (пароль – ADMIN_PASSWORD из .env)")
        else:
            print("[seed] Администратор уже существует")

        original_names = [pet["name"] for pet in ORIGINAL_PETS]
        present = len(
            (await session.scalars(select(Pet).where(Pet.name.in_(original_names)))).all()
        )
        pets_total = await session.scalar(select(func.count()).select_from(Pet))

        if present < len(ORIGINAL_PETS):
            orders_total = await session.scalar(select(func.count()).select_from(Order))
            if pets_total and not orders_total:
                await session.execute(delete(Pet))
                print("[seed] Старые демо-питомцы удалены (заявок в базе нет)")
            for pet in ORIGINAL_PETS:
                exists = await session.scalar(select(Pet).where(Pet.name == pet["name"]))
                if exists is not None:
                    continue
                session.add(
                    Pet(
                        name=pet["name"], type=pet["type"], gender=pet["gender"],
                        age=pet["age"], breed=pet["breed"], status=pet["status"],
                        vaccinated=pet["vaccinated"], sterilized=pet["sterilized"],
                        has_passport=pet["has_passport"], character=pet["character"],
                        short_desc=pet["short_desc"], story=pet["story"],
                        photo_url=f"/uploads/pet_{pet['image']}",
                    )
                )
            added = len(ORIGINAL_PETS) - present
            print(f"[seed] Добавлено питомцев с фотографиями: {added}")
        else:
            print("[seed] Все 8 питомцев сайта уже в базе")

        await session.commit()
    print("[seed] Готово")

if __name__ == "__main__":
    asyncio.run(seed())
