"""Pydantic-схемы: проверка входных данных и формат ответов.

Важно: в ответах API (UserOut) никогда не отдаётся пароль или его хэш.
Справочники внизу файла используются и в API, и в админ-панели.
"""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

USER_STATUS_LABELS: dict[str, str] = {
    "inactive": "Не активен",
    "verified": "Верифицирован",
    "admin": "Администратор",
}

MASCOTS: dict[str, dict[str, str]] = {
    "inactive": {
        "animal": "Муха",
        "name": "Жужа",
        "emoji": "🪰",
        "greeting": "Аккаунт ещё не активен – рядом дремлет сонная муха Жужа.",
    },
    "verified": {
        "animal": "Лис",
        "name": "Фуфырик",
        "emoji": "🦊",
        "greeting": "Аккаунт верифицирован – с вами хитрый лис Фуфырик!",
    },
    "admin": {
        "animal": "Слон",
        "name": "Бонифаций",
        "emoji": "🐘",
        "greeting": "Вы администратор – мудрый слон Бонифаций на страже приюта.",
    },
}

PET_TYPE_LABELS: dict[str, str] = {"cat": "Кошка", "dog": "Собака", "other": "Другое"}
PET_GENDER_LABELS: dict[str, str] = {"male": "Мальчик", "female": "Девочка"}
PET_STATUSES: list[str] = ["Ищет дом", "На передержке", "Нашёл дом"]
ORDER_STATUSES: list[str] = ["На рассмотрении", "Встреча назначена", "Одобрена", "Отклонена"]
VOLUNTEER_DIRECTIONS: dict[str, str] = {
    "walk": "Выгул собак",
    "care": "Уход и кормление",
    "photo": "Фотосъёмка питомцев",
    "transport": "Транспортировка",
    "events": "Помощь на мероприятиях",
    "vet": "Помощь ветеринару",
}
VOLUNTEER_STATUS_LABELS: dict[str, str] = {
    "new": "Новая",
    "approved": "Одобрена",
    "rejected": "Отклонена",
}

EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

class RegisterIn(BaseModel):

    name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)
    phone: str = Field(min_length=5, max_length=30)
    password: str = Field(min_length=6, max_length=128)
    city: str | None = Field(default=None, max_length=100)

class LoginIn(BaseModel):
    email: str
    password: str

class AdminLoginIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    city: str | None = None
    status: str
    is_volunteer: bool = False
    avatar_url: str | None = None
    created_at: datetime

    status_label: str = ""
    mascot: dict[str, str] = {}

    @model_validator(mode="after")
    def _fill_display_fields(self) -> "UserOut":
        self.status_label = USER_STATUS_LABELS.get(self.status, self.status)
        if not self.mascot:
            self.mascot = MASCOTS.get(self.status, {})
        return self

class UserUpdateIn(BaseModel):

    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, min_length=5, max_length=30)
    city: str | None = Field(default=None, max_length=100)
    status: str | None = None
    is_volunteer: bool | None = None

class AuthOut(BaseModel):

    token: str
    user: UserOut

class PetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    gender: str
    age: str = ""
    breed: str | None = None
    photo_url: str | None = None
    status: str
    vaccinated: bool = False
    sterilized: bool = False
    has_passport: bool = False
    short_desc: str | None = None
    story: str | None = None
    character: list[str] | None = None
    description: str | None = None
    created_at: datetime

    type_label: str = ""
    gender_label: str = ""

    @model_validator(mode="after")
    def _fill_labels(self) -> "PetOut":
        self.type_label = PET_TYPE_LABELS.get(self.type, self.type)
        self.gender_label = PET_GENDER_LABELS.get(self.gender, self.gender)
        return self

class OrderCreateIn(BaseModel):
    pet_id: int
    phone: str = Field(min_length=5, max_length=30)
    visit_date: date | None = None
    comment: str | None = Field(default=None, max_length=2000)

class OrderStatusIn(BaseModel):
    status: str

class OrderOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    pet_id: int
    pet_name: str = ""
    pet_type: str | None = None
    pet_photo_url: str | None = None
    phone: str
    visit_date: date | None = None
    comment: str | None = None
    status: str
    created_at: datetime

class VolunteerCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)
    phone: str = Field(min_length=5, max_length=30)
    city: str = Field(min_length=2, max_length=100)
    direction: str
    motivation: str | None = Field(default=None, max_length=2000)

class VolunteerStatusIn(BaseModel):
    status: str

class VolunteerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    name: str
    email: str
    phone: str
    city: str = ""
    direction: str
    motivation: str | None = None
    status: str
    created_at: datetime

    direction_label: str = ""
    status_label: str = ""

    @model_validator(mode="after")
    def _fill_labels(self) -> "VolunteerOut":
        self.direction_label = VOLUNTEER_DIRECTIONS.get(self.direction, self.direction)
        self.status_label = VOLUNTEER_STATUS_LABELS.get(self.status, self.status)
        return self

class VolunteerHoursIn(BaseModel):
    user_id: int
    worked_on: date
    hours: int = Field(ge=1, le=24)
    description: str | None = Field(default=None, max_length=500)

class VolunteerHoursOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    worked_on: date
    hours: int
    description: str | None = None
    created_at: datetime
