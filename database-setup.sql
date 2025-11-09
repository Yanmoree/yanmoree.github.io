-- =============================================================================
-- ИНСТРУКЦИЯ ПО СОЗДАНИЮ БАЗЫ ДАННЫХ ДЛЯ ПРОЕКТА E-COMMERCE
-- =============================================================================
-- Этот скрипт создает полную структуру базы данных для работы приложения
-- Выполните все команды по порядку в вашем Supabase SQL Editor
-- =============================================================================

-- 1. СОЗДАНИЕ ТИПОВ (ENUMS)
-- -----------------------------------------------------------------------------

-- Создание типа для ролей пользователей
CREATE TYPE public.app_role AS ENUM ('admin', 'employee', 'user');


-- 2. СОЗДАНИЕ ТАБЛИЦ
-- -----------------------------------------------------------------------------

-- Таблица профилей пользователей
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  company TEXT,
  date_of_birth DATE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Таблица ролей пользователей
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (user_id, role)
);

-- Таблица товаров
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  detailed_description TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Таблица корзины
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Таблица чат-сессий
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active',
  escalated_to_employee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Таблица сообщений чата
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Таблица сообщений поддержки
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);


-- 3. СОЗДАНИЕ STORAGE BUCKETS
-- -----------------------------------------------------------------------------

-- Создание bucket для аватаров (публичный)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);


-- 4. ВКЛЮЧЕНИЕ ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;


-- 5. СОЗДАНИЕ ФУНКЦИЙ
-- -----------------------------------------------------------------------------

-- Функция для проверки роли пользователя
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Функция для обновления поля updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Функция для обновления поля updated_at в таблице profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  
  -- Назначаем роль пользователя по умолчанию
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


-- 6. СОЗДАНИЕ ТРИГГЕРОВ
-- -----------------------------------------------------------------------------

-- Триггер для автоматического обновления updated_at в products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Триггер для автоматического обновления updated_at в chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Триггер для автоматического обновления updated_at в profiles
CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Триггер для создания профиля при регистрации нового пользователя
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 7. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ PROFILES
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);


-- 8. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ USER_ROLES
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);


-- 9. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ PRODUCTS
-- -----------------------------------------------------------------------------

CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));


-- 10. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ CART_ITEMS
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own cart"
ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own cart"
ON public.cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
ON public.cart_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
ON public.cart_items
FOR DELETE
USING (auth.uid() = user_id);


-- 11. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ CHAT_SESSIONS
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own chat sessions"
ON public.chat_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
ON public.chat_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Employees can view escalated sessions"
ON public.chat_sessions
FOR SELECT
USING (
  escalated_to_employee = true 
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Employees can update escalated sessions"
ON public.chat_sessions
FOR UPDATE
USING (
  escalated_to_employee = true 
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);


-- 12. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ CHAT_MESSAGES
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view messages from own sessions"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to own sessions"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can view messages from escalated sessions"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.escalated_to_employee = true
  )
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Employees can insert messages to escalated sessions"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.escalated_to_employee = true
  )
  AND (has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);


-- 13. ПОЛИТИКИ RLS ДЛЯ ТАБЛИЦЫ SUPPORT_MESSAGES
-- -----------------------------------------------------------------------------

CREATE POLICY "Anyone can insert support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));


-- 14. ПОЛИТИКИ RLS ДЛЯ STORAGE BUCKETS
-- -----------------------------------------------------------------------------

-- Политики для bucket avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- 15. ВКЛЮЧЕНИЕ REALTIME ДЛЯ ЧАТА
-- -----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;


-- =============================================================================
-- ИНСТРУКЦИЯ ПО НАСТРОЙКЕ
-- =============================================================================

/*
1. СОЗДАНИЕ ПРОЕКТА SUPABASE:
   - Перейдите на https://supabase.com
   - Создайте новый проект
   - Дождитесь завершения инициализации

2. ВЫПОЛНЕНИЕ SQL СКРИПТА:
   - Откройте SQL Editor в панели Supabase
   - Скопируйте и вставьте весь этот скрипт
   - Нажмите "Run" для выполнения

3. НАСТРОЙКА AUTH:
   - Перейдите в Authentication -> Settings
   - Включите Email Provider
   - Настройте Email Templates по необходимости
   - Для разработки включите "Enable email confirmations"

4. ПОЛУЧЕНИЕ API КЛЮЧЕЙ:
   - Перейдите в Settings -> API
   - Скопируйте:
     * Project URL
     * anon public key
     * service_role key (храните в секрете!)

5. НАСТРОЙКА .ENV ФАЙЛА:
   Создайте файл .env в корне проекта:
   
   VITE_SUPABASE_URL=ваш_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=ваш_anon_key
   VITE_SUPABASE_PROJECT_ID=ваш_project_id

6. СОЗДАНИЕ ПЕРВОГО АДМИНИСТРАТОРА:
   После регистрации первого пользователя выполните в SQL Editor:
   
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('ваш_user_id', 'admin');
   
   Получить user_id можно через:
   SELECT id FROM auth.users WHERE email = 'ваш_email';

7. НАСТРОЙКА EDGE FUNCTIONS:
   Если используете Edge Functions (например, для чат-бота):
   - Установите Supabase CLI
   - Выполните: supabase functions deploy chat-bot
   - Добавьте необходимые секреты через: supabase secrets set KEY=value

8. ТЕСТИРОВАНИЕ:
   - Зарегистрируйте тестового пользователя
   - Проверьте создание профиля
   - Проверьте работу RLS политик
   - Добавьте тестовые товары

9. МОНИТОРИНГ:
   - Database -> Logs: Проверка SQL логов
   - Authentication -> Users: Управление пользователями
   - Storage: Проверка загрузки файлов

10. БЕЗОПАСНОСТЬ:
   ⚠️ ВАЖНО:
   - Никогда не публикуйте service_role key
   - Используйте RLS для всех таблиц
   - Регулярно проверяйте логи безопасности
   - Используйте HTTPS для всех запросов
   - Настройте CORS правильно для production

ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
- Документация Supabase: https://supabase.com/docs
- Примеры RLS политик: https://supabase.com/docs/guides/auth/row-level-security
- Edge Functions: https://supabase.com/docs/guides/functions
*/
