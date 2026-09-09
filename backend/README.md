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

### Таблица `retro_rooms`
Комнаты проведения ретроспектив:
*   `id` (TEXT, PK) — UUID комнаты
*   `name` (TEXT) — Название комнаты
*   `template` (TEXT) — Идентификатор шаблона (`went-well`, `mad-sad-glad`, `start-stop-continue`)
*   `stage` (TEXT) — Текущая стадия (`brainstorming`, `grouping`, `voting`, `discussion`, `completed`)
*   `facilitator_id` (TEXT, FK -> `user_profiles.id`) — ID создателя/фасилитатора
*   `anonymous_mode` (TEXT) — Флаг включения анонимного режима создания карточек (`true` / `false`)
*   `deleted` (TEXT) — Флаг мягкого удаления комнаты (`true` / `false`)
*   `created_at`, `updated_at` (TEXT) — Метки времени создания и обновления

### Таблица `retro_participants`
Участники комнат ретроспектив:
*   `id` (TEXT, PK) — UUID записи участника
*   `room_id` (TEXT, FK -> `retro_rooms.id`) — Ссылка на комнату (каскадное удаление)
*   `user_id` (TEXT, FK -> `user_profiles.id`) — Ссылка на профиль пользователя
*   `role` (TEXT) — Роль в комнате (`facilitator` / `participant`)
*   `joined_at` (TEXT) — Время присоединения

### Таблица `retro_cards`
Карточки с отзывами/заметками:
*   `id` (TEXT, PK) — UUID карточки
*   `room_id` (TEXT, FK -> `retro_rooms.id`) — Ссылка на комнату
*   `column_id` (TEXT) — Идентификатор колонки шаблона
*   `text` (TEXT) — Содержимое карточки
*   `author_id` (TEXT, FK -> `user_profiles.id`) — Автор карточки
*   `clusterId` (TEXT, Nullable) — ID кластера карточек при объединении
*   `is_anonymous` (TEXT) — Флаг анонимности карточки
*   `position` (INTEGER) — Порядковый номер сортировки в колонке
*   `created_at`, `updated_at` (TEXT) — Метки времени

### Таблица `retro_votes`
Голоса участников за карточки:
*   `id` (TEXT, PK) — UUID голоса
*   `card_id` (TEXT, FK -> `retro_cards.id`) — Карточка, за которую отдан голос
*   `user_id` (TEXT, FK -> `user_profiles.id`) — Пользователь, отдавший голос
*   `created_at` (TEXT) — Время голосования

### Таблица `retro_action_items`
Задачи (Action Items), сформированные по результатам обсуждения:
*   `id` (TEXT, PK) — UUID задачи
*   `card_id` (TEXT, FK -> `retro_cards.id`) — Карточка, породившая задачу
*   `room_id` (TEXT, FK -> `retro_rooms.id`) — Комната ретроспективы
*   `text` (TEXT) — Формулировка задачи
*   `assignee_id` (TEXT, Nullable, FK -> `user_profiles.id`) — Ответственный исполнитель
*   `done` (TEXT) — Статус выполнения (`true` / `false`)
*   `created_at`, `updated_at` (TEXT) — Метки времени

### Таблица `retro_action_item_comments`
Комментарии и обсуждения по конкретным задачам:
*   `id` (TEXT, PK) — UUID комментария
*   `action_item_id` (TEXT, FK -> `retro_action_items.id`) — Задача, к которой оставлен комментарий
*   `user_id` (TEXT, FK -> `user_profiles.id`) — Автор комментария
*   `text` (TEXT) — Текст комментария
*   `created_at`, `updated_at` (TEXT) — Метки времени

