# Руководство по интеграции проекта

## Архитектура проекта

### Стек технологий
- **Frontend**: React 18, TypeScript, Vite
- **Стилизация**: Tailwind CSS, shadcn/ui компоненты
- **Backend**: Lovable Cloud (Supabase)
- **База данных**: PostgreSQL
- **Реал-тайм**: Supabase Realtime
- **Аутентификация**: Supabase Auth
- **AI**: Lovable AI Gateway (Gemini 2.5 Flash)

### Структура проекта
```
├── src/
│   ├── components/      # React компоненты
│   ├── pages/          # Страницы приложения
│   ├── hooks/          # Кастомные хуки
│   ├── lib/            # Утилиты
│   └── integrations/   # Интеграции (Supabase)
├── supabase/
│   └── functions/      # Edge Functions
└── public/             # Статические файлы
```

## Схема базы данных

### Таблицы

**profiles** - Профили пользователей
- id (UUID, PK)
- full_name, email, phone, address, city, postal_code
- date_of_birth, bio, avatar_url
- created_at, updated_at

**user_roles** - Роли пользователей
- id (UUID, PK)
- user_id (UUID, FK)
- role (enum: admin, employee, user)

**products** - Товары
- id, name, description, price, stock, category, image_url

**cart_items** - Корзина
- id, user_id, product_id, quantity

**chat_sessions** - Сессии чата
- id, user_id, status, escalated_to_employee, employee_id

**chat_messages** - Сообщения чата
- id, session_id, user_id, role, content

## Локальная установка

### 1. Клонирование репозитория
```bash
git clone <your-repo-url>
cd <project-name>
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка .env
Файл `.env` уже настроен автоматически при использовании Lovable Cloud

### 4. Запуск dev сервера
```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

## Подключение к базе данных

### Реквизиты подключения
- **Host**: `db.vdkdopwyzwfkzhyovjge.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: Доступен в настройках Cloud

### Из React/Next.js приложения
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vdkdopwyzwfkzhyovjge.supabase.co',
  'YOUR_ANON_KEY'
)

// Получение данных
const { data } = await supabase
  .from('products')
  .select('*')
```

### Из мобильного приложения (React Native)
```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  'https://vdkdopwyzwfkzhyovjge.supabase.co',
  'YOUR_ANON_KEY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    }
  }
)
```

### Из Python
```python
from supabase import create_client

supabase = create_client(
    "https://vdkdopwyzwfkzhyovjge.supabase.co",
    "YOUR_ANON_KEY"
)

products = supabase.table("products").select("*").execute()
```

## API Endpoints

### Edge Function: chat-bot
**URL**: `https://vdkdopwyzwfkzhyovjge.supabase.co/functions/v1/chat-bot`

**Метод**: POST

**Headers**:
```
Authorization: Bearer <user-token>
Content-Type: application/json
```

**Body**:
```json
{
  "message": "Как отследить заказ?",
  "sessionId": "uuid-or-null"
}
```

**Response**:
```json
{
  "message": "Ответ бота",
  "sessionId": "session-uuid",
  "needEscalation": false
}
```

## Аутентификация

### Регистрация
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Иван Иванов'
    }
  }
})
```

### Вход
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Проверка сессии
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

## Система ролей

- **admin** - Полный доступ ко всем функциям
- **employee** - Доступ к чатам с клиентами
- **user** - Обычный пользователь

## Чат-система

### Архитектура
1. Клиент пишет боту (Lovable AI)
2. Бот отвечает на FAQ
3. Если бот не может помочь → эскалация к сотруднику
4. Сотрудник видит запрос в `/employee-chat`
5. Real-time обмен сообщениями

### Интеграция чата в другое приложение
```typescript
// Подписка на новые сообщения
const channel = supabase
  .channel('chat-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

## Развертывание

### Через Lovable (автоматически)
1. Нажмите кнопку "Publish" в редакторе
2. Ваше приложение развернется автоматически

### Через GitHub + Vercel
1. Экспортируйте проект в GitHub
2. Подключите репозиторий к Vercel
3. Настройте переменные окружения:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY

## Экспорт данных

### SQL Dump
Через настройки Cloud → Database → Export

### Programmatic Export
```typescript
// Экспорт всех продуктов в JSON
const { data } = await supabase.from('products').select('*')
console.log(JSON.stringify(data, null, 2))
```

## Безопасность

- **RLS**: Все таблицы защищены Row Level Security
- **JWT**: Аутентификация через JWT токены
- **Secrets**: API ключи хранятся в Supabase Secrets

## Поддержка

Для вопросов по интеграции обращайтесь к документации:
- [Lovable Docs](https://docs.lovable.dev)
- [Supabase Docs](https://supabase.com/docs)
