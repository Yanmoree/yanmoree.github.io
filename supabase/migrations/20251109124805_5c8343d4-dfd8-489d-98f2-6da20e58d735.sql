-- Добавляем поле компании в профили
ALTER TABLE public.profiles ADD COLUMN company text;

-- Добавляем подробное описание для товаров
ALTER TABLE public.products ADD COLUMN detailed_description text;