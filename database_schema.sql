-- ==============================================================================
-- PHASE 1: DATABASE SCHEMA (SUPABASE) - HYBRID SSOT
-- Idempotent: Safe to run multiple times
-- ==============================================================================

-- 0. Drop existing tables and type (in reverse dependency order)
DROP TABLE IF EXISTS public.booking_items CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.barbers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Legacy table
DROP TABLE IF EXISTS public.shop_settings CASCADE;
DROP TYPE IF EXISTS booking_status;

-- 1. Create enum for booking status
CREATE TYPE booking_status AS ENUM (
    'awaiting_payment',
    'pending_confirmation',
    'confirmed',
    'completed',
    'cancelled'
);

-- 2. Create profiles table (links to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create barbers table
CREATE TABLE public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    total_price INT NOT NULL,
    payment_proof_url TEXT,
    status booking_status NOT NULL DEFAULT 'awaiting_payment',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create booking_items table
CREATE TABLE public.booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    price_at_booking INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create shop_settings table
CREATE TABLE public.shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closed_date DATE UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create barber_unavailable_slots table
CREATE TABLE public.barber_unavailable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(barber_id, date, time)
);

-- 9. Create barber_absences table
CREATE TABLE public.barber_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(barber_id, date)
);

-- ==============================================================================
-- TRIGGER FOR NEW USERS
-- ==============================================================================
-- Automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user' -- Default role is user
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_unavailable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Allow public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public read shop_settings" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read barber_unavailable_slots" ON public.barber_unavailable_slots FOR SELECT USING (true);
CREATE POLICY "Allow public read barber_absences" ON public.barber_absences FOR SELECT USING (true);
CREATE POLICY "Allow public all profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public all bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow public all booking_items" ON public.booking_items FOR ALL USING (true);

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

INSERT INTO public.barbers (name, specialty, image_url) VALUES 
('Danang Maulana', 'Master Barber Specialist', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80'),
('Ujang Mawang', 'Senior Grooming Specialist', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80'),
('Julian Tompel', 'Senior Grooming Specialist', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80');

INSERT INTO public.services (name, price, description) VALUES 
('Haircut', 50000, 'Premium precision haircut with styling.'),
('Colouring', 120000, 'Full hair colouring using high quality products.'),
('Hair Perm', 200000, 'Long lasting hair perming for textured looks.');
