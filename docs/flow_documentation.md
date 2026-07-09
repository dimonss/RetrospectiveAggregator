# 🔄 Документация пользовательских сценариев (User Flows & Architecture)

Этот документ содержит описание архитектуры интерфейса, переходов состояний и структуры данных MVP-версии платформы **RetroAggregator**.

---

## 1. Общая карта экранов и путей (Navigation Flow)

Диаграмма ниже показывает, как пользователь перемещается между экранами платформы от входа до экспорта результатов.

```mermaid
graph TD
    A["🔐 Экран входа (LoginPage)"] -->|"Google / Telegram"| B["📋 Дашборд (DashboardPage)"]
    B -->|"Выйти"| A
    B -->|"Кнопка 'Создать'"| C["⚙️ Выбор шаблона (TemplateModal)"]
    C -->|"Выбор шаблона (Went Well, etc)"| D["💻 Ретро-комната (RetroPage)"]
    D -->|"Ссылка в шапке / Завершить"| E["📊 Итоги (SummaryPage)"]
    E -->|"Назад"| D
    D -->|"Назад в дашборд"| B
    E -->|"Экспорт"| F["📝 Копирование Markdown / Telegram / Slack"]
```

---

## 2. Стадии проведения ретроспективы (Stage Transitions)

Ретроспектива управляется фасилитатором (создателем комнаты). Переключение стадий изменяет доступные действия для всех участников сессии.

```mermaid
graph LR
    S1["💡 Brainstorming<br>(Сбор идей)"] --> S2["🗂️ Grouping<br>(Группировка)"]
    S2 --> S3["🗳️ Voting<br>(Голосование)"]
    S3 --> S4["💬 Discussion<br>(Обсуждение)"]
    
    style S1 fill:#a855f7,stroke:#333,stroke-width:2px,color:#fff
    style S2 fill:#3b82f6,stroke:#333,stroke-width:2px,color:#fff
    style S3 fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style S4 fill:#22c55e,stroke:#333,stroke-width:2px,color:#fff
```

### Доступные действия на каждой стадии

| Стадия | Кто может переключить | Добавление карт | Смена колонок | Голосование | Action Items |
|---|---|---|---|---|---|
| **Brainstorming** | Фасилитатор | ✅ Да (все) | ❌ Нет | ❌ Нет | ❌ Нет |
| **Grouping** | Фасилитатор | ❌ Нет | ✅ Drag-n-Drop (все) | ❌ Нет | ❌ Нет |
| **Voting** | Фасилитатор | ❌ Нет | ❌ Нет | ✅ Да (лимит 5) | ❌ Нет |
| **Discussion** | Фасилитатор | ❌ Нет | ❌ Нет | ❌ Нет | ✅ Да (все) |

---

## 3. Схема данных (Data Model Relationships)

Интерфейс спроектирован на основе следующих типов данных:

```mermaid
classDiagram
    class User {
        +string id
        +string name
        +string avatar
        +string color
    }
    class RetroRoom {
        +string id
        +string name
        +TemplateId template
        +Stage stage
        +string facilitatorId
        +string[] participantIds
        +boolean anonymousMode
        +RetroColumn[] columns
        +RetroCard[] cards
    }
    class RetroColumn {
        +string id
        +string title
        +string emoji
        +string color
    }
    class RetroCard {
        +string id
        +string text
        +string authorId
        +string columnId
        +string[] votes
        +ActionItem[] actionItems
    }
    class ActionItem {
        +string id
        +string text
        +string assigneeId
        +boolean done
    }

    RetroRoom "1" *-- "many" RetroColumn : содержит
    RetroRoom "1" *-- "many" RetroCard : содержит
    RetroCard "many" o-- "many" User : голоса (votes)
    RetroCard "1" *-- "many" ActionItem : задачи
    ActionItem "many" o-- "1" User : исполнитель
    RetroRoom "many" o-- "many" User : участники
```

---

## 4. Сценарий: Группировка карточек (Drag & Drop)

На стадии **Grouping** участники могут перетаскивать карточки. Движок DnD (реализованный на `@dnd-kit`) обрабатывает события перемещения:

```mermaid
flowchart TD
    Start["Захват карточки мышей/тачем"] --> Drag["Перетаскивание по доске"]
    Drag --> Drop{"Куда отпустили?"}
    
    Drop -->|"В пустую зону колонки"| MoveCol["Карточка перемещается в новую колонку"]
    Drop -->|"На другую карточку"| Cluster["Создание кластера (объединение тем)"]
    Drop -->|"Вне доски"| Cancel["Отмена (карточка возвращается обратно)"]
    
    MoveCol --> End["Сохранение нового состояния доски"]
    Cluster --> End
    Cancel --> End
```

---

## 5. Сценарий: Голосование и ранжирование (Voting & Sorting)

Процесс приоритизации тем перед обсуждением:

```mermaid
sequenceDiagram
    actor User as Участник
    participant Board as Доска (RetroPage)
    participant Header as Панель голосов

    User->>Board: Наведение на карточку (стадия Voting)
    Note over User, Board: Проверка: осталось голосов > 0?
    Board->>User: Показ кнопки "Лайк" (thumbs up)
    
    User->>Board: Клик по кнопке "Лайк"
    Board->>Board: Добавление ID пользователя в votes карточки
    Board->>Header: Уменьшение доступных голосов (max 5)
    Header->>User: Обновление индикатора (точек)
    
    Note over Board: При переходе на стадию Discussion...
    Board->>Board: Сортировка карточек в колонках по количеству голосов (desc)
```

---

## 6. Сценарий: Генерация итогов и экспорт (Summary & Export)

Сценарий завершения встречи:

```mermaid
flowchart TD
    Finish["Фасилитатор кликает 'Завершить'"] --> SummaryPage["Переход на SummaryPage"]
    SummaryPage --> LoadAI["Сбор всех Action Items из карточек"]
    SummaryPage --> RenderStats["Расчет статистики (активность, голоса)"]
    
    SummaryPage --> ActionCheck["Участники могут отмечать задачи выполненными"]
    SummaryPage --> Export["Кнопка 'Скопировать для Telegram/Slack'"]
    
    Export --> GenMD["Генерация Markdown-строки с чек-листом"]
    GenMD --> Copy["Запись в буфер обмена"]
    Copy --> Slack["Форматированная вставка в Slack/Telegram"]
```
