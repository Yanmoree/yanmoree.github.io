-- Migration Part 1: Update enum first
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';