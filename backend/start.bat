@echo off
rem Запуск backend-сервера приюта "Лапа Помощи" одним двойным кликом.
rem Сам создаёт виртуальное окружение и устанавливает зависимости при первом запуске.
chcp 65001 >nul
cd /d "%~dp0"

if not exist .venv (
    echo [start] Создаю виртуальное окружение .venv ...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

if not exist .env (
    echo [start] ВНИМАНИЕ: нет файла .env, копирую из .env.example
    copy .env.example .env >nul
)

echo [start] Запускаю сервер (Ctrl+C для остановки) ...
python run.py
pause
