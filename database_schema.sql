-- ==============================================================================
-- PHASE 1: DATABASE SCHEMA (SUPABASE)
-- Idempotent: Safe to run multiple times
-- ==============================================================================

-- 0. Drop existing tables and type (in reverse dependency order)
DROP TABLE IF EXISTS public.booking_items CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.barbers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS booking_status;

-- 1. Create enum for booking status
CREATE TYPE booking_status AS ENUM (
    'awaiting_payment',
    'pending_confirmation',
    'confirmed',
    'completed',
    'cancelled'
);

-- 2. Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Allow public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public all bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow public all booking_items" ON public.booking_items FOR ALL USING (true);

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

INSERT INTO public.users (id, name, phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Dummy User', '081234567890');

INSERT INTO public.barbers (name, specialty, image_url) VALUES 
('Danang Maulana', 'Master Barber Specialist', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80'),
('Ujang Mawang', 'Senior Grooming Specialist', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80'),
('Julian Tompel', 'Senior Grooming Specialist', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80');

INSERT INTO public.services (name, price) VALUES 
('Haircut', 50000),
('Colouring', 120000),
('Hair Perm', 200000);
