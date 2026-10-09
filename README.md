[![Python](https://img.shields.io/badge/python-3.13-green?style=flat-square)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-latest-green?style=flat-square)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue?style=flat-square)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/sqlalchemy-async-red?style=flat-square)](https://www.sqlalchemy.org/)
[![React](https://img.shields.io/badge/react-19-blue?style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-build_tool-purple?style=flat-square)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/three.js-3D-black?style=flat-square)](https://threejs.org/)
[![Docker](https://img.shields.io/badge/docker-compose-blue?style=flat-square)](https://www.docker.com/)

# 🐾 Лапа Помощи – Animal Shelter Platform

> **Лапа Помощи** — веб-сайт приюта для животных.
> Позволяет посетителям выбирать питомцев и подавать заявки на знакомство, становиться волонтёрами, а сотрудникам приюта — управлять всей базой через админ-панель.

**Версия:** 1.0
**Статус:** MVP
**Тип проекта:** Учебный проект

---

# 🎯 Идея проекта

Многие приюты ведут учёт питомцев и заявок в таблицах и мессенджерах, а людям сложно найти животное и понять, как его забрать.

Приложение **Лапа Помощи** решает эту проблему, предоставляя **единое цифровое пространство**, где можно:

🐕 просматривать каталог питомцев с фильтрами
❤️ сохранять понравившихся животных в избранное
📝 подавать заявки на знакомство с питомцем
🤝 оставлять заявки на волонтёрство
🛠 управлять всем сайтом из админ-панели

---

# ✨ Основные возможности

### 🐾 Каталог питомцев

* карточки питомцев с фото
* фильтрация и поиск
* подробная страница: история, характер, вакцинация, стерилизация, паспорт
* 3D-модели животных на сайте (Three.js)

### 📝 Заявки на знакомство

* отправка заявки на выбранного питомца
* просмотр своих заявок и их статусов в профиле
* обработка заявок администратором

### 🤝 Волонтёрство

* форма заявки волонтёра
* учёт отработанных волонтёрских часов
* управление заявками в админ-панели

### 👤 Управление пользователями

* регистрация и авторизация
* личный кабинет, редактирование профиля
* загрузка аватара
* избранные питомцы

### 🛠 Административная панель (`/admin/`)

* статистика по сайту
* управление питомцами (добавление, редактирование, удаление, фото)
* управление пользователями, заявками и волонтёрами
* менеджер загруженных файлов

---

# 🧩 Архитектура проекта

Проект реализован по **клиент-серверной архитектуре**.

```
Frontend (React SPA) + nginx
        ↓
     REST API (/api)
        ↓
Backend (FastAPI)
        ↓
    PostgreSQL
```

---

# 🧰 Технологический стек

## Backend

* **Python 3.13**
* **FastAPI**
* **PostgreSQL**
* **SQLAlchemy (async) + asyncpg**
* **Alembic** (миграции)
* **JWT Authentication** (PyJWT)
* **bcrypt** (хэширование паролей)

## Frontend

* **React**
* **React Router**
* **Three.js** (`@react-three/fiber`, `@react-three/drei`)
* **Vite**
* **oxlint**

## Инфраструктура

* **Docker / Docker Compose**
* **nginx** (раздача фронтенда и прокси на API)

---

# 🚀 Быстрый запуск

## ▶️ Запуск в Docker (рекомендуется)

Нужны Docker и Docker Compose v2.

```bash
git clone <URL-репозитория> animal-shelter
cd animal-shelter

cp .env.example .env
nano .env        # задайте пароли и JWT_SECRET (openssl rand -hex 32)

docker compose up -d --build
```

Контейнеры автоматически:

* поднимают PostgreSQL
* ждут готовности базы данных
* применяют миграции Alembic
* создают администратора и демо-питомцев (при `RUN_SEED=true`)
* запускают backend и nginx с фронтендом

После запуска приложение будет доступно по адресу:

```
http://<IP-сервера>:80
```

Админ-панель и документация API:

```
http://<IP-сервера>/admin/
http://<IP-сервера>/docs
```

### Полезные команды

```bash
docker compose ps                    # состояние контейнеров
docker compose logs -f backend       # логи backend
docker compose up -d --build         # обновление после git pull
docker compose down                  # остановка (данные сохраняются)
docker compose down -v               # остановка + удаление БД и загрузок

# резервная копия БД
docker compose exec db pg_dump -U shelter animal_shelter > backup.sql
```

Данные хранятся в Docker volumes: `pgdata` (база) и `uploads` (загруженные фото).

### ⚙️ Переменные окружения (`.env`)

| Переменная          | Описание                                          |
| ------------------- | ------------------------------------------------- |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL (обязательно)                   |
| `JWT_SECRET`        | Секрет для подписи JWT (обязательно)              |
| `ADMIN_EMAIL`       | Email администратора                              |
| `ADMIN_PASSWORD`    | Пароль администратора (обязательно)               |
| `RUN_SEED`          | `true` – создать админа и демо-питомцев при старте |
| `HTTP_PORT`         | Порт сайта на сервере (по умолчанию 80)           |
| `CORS_ORIGINS`      | Нужен только если фронтенд на другом домене       |

---

## 🐍 Backend локально

```bash
cd backend

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

python setup_db.py --seed        # создаёт роль и БД, применяет миграции, демо-данные

python run.py
```

На Windows можно запустить двойным кликом `start.bat`.

API документация:

```
http://127.0.0.1:8000/docs
```

Админ-панель:

```
http://127.0.0.1:8000/admin/
```

---

## ⚡ Frontend локально

```bash
cd frontend

npm install

npm run dev
```

Открыть:

```
http://127.0.0.1:5173
```

---

# 🗄 Структура базы данных

Основные сущности системы:

| Таблица                | Описание                          |
| ---------------------- | --------------------------------- |
| users                  | Пользователи и администраторы     |
| pets                   | Питомцы приюта                    |
| orders                 | Заявки на знакомство с питомцем   |
| volunteer_applications | Заявки на волонтёрство            |
| volunteer_hours        | Журнал волонтёрских часов         |

Связи:

```
User 1 ---- * Orders
Pet  1 ---- * Orders
User 1 ---- * VolunteerApplications
User 1 ---- * VolunteerHours
```

---

# 🔐 Безопасность

В системе реализованы базовые механизмы защиты:

* JWT Authentication (Bearer-токен)
* Хэширование паролей (bcrypt)
* Разграничение ролей (пользователь / администратор)
* Защита админ-эндпоинтов
* Параметризованные запросы (SQLAlchemy ORM)
* Секреты хранятся в `.env` и не попадают в git

---

# 👥 Роли пользователей

### 👤 Гость

* просмотр каталога и страниц питомцев
* регистрация и вход

### 🐾 Пользователь

* избранные питомцы
* заявки на знакомство
* заявка на волонтёрство
* личный кабинет с аватаром

### 🛠 Администратор

* просмотр статистики
* управление питомцами, пользователями и заявками
* учёт волонтёрских часов
* управление загруженными файлами

---

# 📱 Интерфейс

Особенности UI:

* яркий дружелюбный дизайн
* карточная система питомцев
* модальные окна
* 3D-анимация животных
* адаптивная верстка

Поддерживаемые устройства:

* Desktop
* Tablet
* Mobile

---

# 📂 Структура репозитория

```
animal-shelter/
├── backend/            FastAPI, миграции Alembic, админ-панель, seed
├── frontend/           React + Vite
├── docker-compose.yml
└── .env.example
```

---

# 📊 Возможности дальнейшего развития

* email-уведомления о статусе заявок
* онлайн-пожертвования
* личные кабинеты сотрудников приюта
* интеграция с картами и соцсетями
* мобильное приложение

---

# 📄 Лицензия

Учебный проект. Используется в образовательных целях.
Не для коммерческого использования.