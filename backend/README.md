# Retrospective Aggregator — Backend

Серверная часть платформы для проведения ретроспектив. Работает в качестве Backend-for-Frontend (BFF), проксируя авторизацию через внешний сервис **ChalyshAuth** и локально кэшируя/сохраняя профили пользователей в SQLite.

## Технологический стек

*   **Node.js 24** (управляется через NVM)
*   **Fastify 5** — легковесный и высокопроизводительный фреймворк
*   **TypeScript** (strict mode, ESM модули)
*   **Drizzle ORM** — типобезопасная ORM для взаимодействия с БД
*   **SQLite (better-sqlite3)** — локальная СУБД с включенным режимом WAL (Write-Ahead Logging)
*   **Zod** + `fastify-type-provider-zod` — валидация схем и автогенерация документации OpenAPI / Swagger

---

## Требования

Для запуска проекта необходимы:
*   [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager)
*   Установленная Node.js v24.x

---

## Установка и запуск

1.  **Перейдите в директорию бэкенда**:
    ```bash
    cd backend
    ```

2.  **Активируйте нужную версию Node.js**:
    ```bash
    nvm use
    ```

3.  **Установите зависимости**:
    ```bash
    npm install
    ```

4.  **Создайте конфигурационный файл `.env`** на основе шаблона и укажите в нём секреты:
    ```bash
    cp .env.example .env
    ```
    *Обязательно установите корректный `JWT_SECRET` (совпадающий с секретом сервиса ChalyshAuth) для успешной проверки токенов.*

5.  **Примените миграции базы данных**:
    ```bash
    npm run db:migrate
    ```

6.  **Запустите сервер в режиме разработки**:
    ```bash
    npm run dev
    ```

Сервер запустится по адресу: `http://localhost:3001`

---

## API Документация (Swagger)

Интерактивная документация Swagger автоматически генерируется из Zod-схем и доступна при запущенном сервере:
*   **Swagger UI**: `http://localhost:3001/api/docs`
*   **OpenAPI Specification (JSON)**: `http://localhost:3001/api/docs/json`

---

## Доступные скрипты

*   `npm run dev` — Запуск Fastify в dev-режиме с автоматическим перезапуском при изменении файлов (`tsx watch`).
*   `npm run build` — Компиляция TypeScript-кода в директорию `dist`.
*   `npm run start` — Запуск скомпилированного Production-билда из директории `dist`.
*   `npm run start:prod` — Запуск Production-билда в фоновом режиме через PM2.
*   `npm run db:generate` — Генерация файлов миграций на основе схемы Drizzle.
*   `npm run db:migrate` — Применение незапущенных миграций к локальной БД SQLite.
*   `npm run db:studio` — Запуск графического интерфейса Drizzle Studio для удобного просмотра таблиц БД.

---

## База данных и структура таблиц

Локальная база данных SQLite по умолчанию сохраняется по пути `backend/data/retro_aggregator.db` (путь можно переопределить через `DATABASE_PATH` в `.env`).

### Таблица `user_profiles`
Используется для хранения метаданных пользователей, авторизованных в системе:
*   `id` (TEXT, PK) — локальный UUID профиля
*   `auth_user_id` (TEXT, Unique) — ID пользователя из сервиса ChalyshAuth
*   `telegram_id` (TEXT, Nullable) — ID аккаунта Telegram
*   `google_id` (TEXT, Nullable) — ID аккаунта Google
*   `email` (TEXT, Nullable) — Адрес электронной почты
*   `first_name` (TEXT) — Имя пользователя
*   `last_name` (TEXT, Nullable) — Фамилия пользователя
*   `username` (TEXT, Nullable) — Имя пользователя в Telegram/Google
*   `photo_url` (TEXT, Nullable) — Ссылка на аватар профиля
*   `created_at` (TEXT) — Дата создания профиля (ISO)
*   `updated_at` (TEXT) — Дата последнего обновления (ISO)
