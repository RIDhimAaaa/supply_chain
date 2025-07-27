-- Vendor Collective - Complete Supabase Schema
-- Mobile app connecting street food vendors, suppliers, and delivery agents

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- 1. ROLES TABLE
-- =============================================
-- Store the three user roles: vendor, supplier, agent
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the three roles
INSERT INTO public.roles (name) VALUES 
    ('vendor'),
    ('supplier'), 
    ('agent'),
    ('admin');

-- =============================================
-- 2. PROFILES TABLE
-- =============================================
-- Store user-specific data linked to Supabase auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    location GEOGRAPHY(POINT) NULL, -- For storing vendor/supplier coordinates
    phone VARCHAR(20),
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE, -- For admin approval of suppliers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. PRODUCTS TABLE
-- =============================================
-- For suppliers to list their raw materials
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL, -- e.g., 'kg', 'liter', 'piece'
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
    img_emoji TEXT, -- Emoji representation of the product
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only suppliers can create products
    CONSTRAINT supplier_products_check CHECK (
        supplier_id IN (
            SELECT p.id FROM public.profiles p 
            JOIN public.roles r ON p.role_id = r.id 
            WHERE r.name = 'supplier'
        )
    )
);

-- =============================================
-- 4. DEALS TABLE
-- =============================================
-- For suppliers to define tiered, bulk-rate discounts
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    threshold INTEGER NOT NULL CHECK (threshold > 0), -- Quantity needed to unlock deal
    discount NUMERIC(5,4) NOT NULL CHECK (discount >= 0 AND discount <= 1), -- e.g., 0.15 for 15% off
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate thresholds for same product
    UNIQUE(product_id, threshold)
);

-- =============================================
-- 5. CART_ITEMS TABLE
-- =============================================
-- Store items in each vendor's order
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    is_finalized BOOLEAN DEFAULT FALSE,
    final_price NUMERIC(10,2) NULL, -- Can be NULL initially, calculated when finalized
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Ensure only vendors can have cart items
    CONSTRAINT vendor_cart_check CHECK (
        vendor_id IN (
            SELECT p.id FROM public.profiles p 
            JOIN public.roles r ON p.role_id = r.id 
            WHERE r.name = 'vendor'
        )
    ),
    
    -- Prevent duplicate items for same vendor
    UNIQUE(vendor_id, product_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX idx_profiles_location ON public.profiles USING GIST(location);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_is_approved ON public.profiles(is_approved);

-- Products indexes
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_products_is_available ON public.products(is_available);
CREATE INDEX idx_products_name ON public.products(name);

-- Deals indexes
CREATE INDEX idx_deals_product_id ON public.deals(product_id);
CREATE INDEX idx_deals_threshold ON public.deals(threshold);
CREATE INDEX idx_deals_is_active ON public.deals(is_active);

-- Cart items indexes
CREATE INDEX idx_cart_items_vendor_id ON public.cart_items(vendor_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX idx_cart_items_is_finalized ON public.cart_items(is_finalized);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.roles r ON p.role_id = r.id 
            WHERE p.id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Admins can approve suppliers" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.roles r ON p.role_id = r.id 
            WHERE p.id = auth.uid() AND r.name = 'admin'
        )
    );

-- Products policies
CREATE POLICY "Suppliers can manage their own products" ON public.products
    FOR ALL USING (auth.uid() = supplier_id);

CREATE POLICY "Everyone can view available products" ON public.products
    FOR SELECT USING (is_available = true);

-- Deals policies  
CREATE POLICY "Suppliers can manage deals for their products" ON public.deals
    FOR ALL USING (
        product_id IN (
            SELECT id FROM public.products WHERE supplier_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view active deals" ON public.deals
    FOR SELECT USING (is_active = true);

-- Cart items policies
CREATE POLICY "Vendors can manage their own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Suppliers can view cart items for their products" ON public.cart_items
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM public.products WHERE supplier_id = auth.uid()
        )
    );

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to calculate final price with deals applied
CREATE OR REPLACE FUNCTION calculate_final_price(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_base_price NUMERIC;
    v_best_discount NUMERIC := 0;
    v_final_price NUMERIC;
BEGIN
    -- Get base price
    SELECT base_price INTO v_base_price
    FROM public.products
    WHERE id = p_product_id;
    
    -- Find best applicable discount
    SELECT COALESCE(MAX(discount), 0) INTO v_best_discount
    FROM public.deals
    WHERE product_id = p_product_id 
        AND threshold <= p_quantity
        AND is_active = true;
    
    -- Calculate final price
    v_final_price := v_base_price * p_quantity * (1 - v_best_discount);
    
    RETURN v_final_price;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize cart item and calculate price
CREATE OR REPLACE FUNCTION finalize_cart_item(p_cart_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_product_id UUID;
    v_quantity INTEGER;
    v_final_price NUMERIC;
BEGIN
    -- Get cart item details
    SELECT product_id, quantity 
    INTO v_product_id, v_quantity
    FROM public.cart_items
    WHERE id = p_cart_item_id;
    
    -- Calculate final price
    v_final_price := calculate_final_price(v_product_id, v_quantity);
    
    -- Update cart item
    UPDATE public.cart_items
    SET 
        is_finalized = true,
        final_price = v_final_price,
        finalized_at = NOW()
    WHERE id = p_cart_item_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Note: Uncomment the following section if you want to insert sample data
/*
-- Sample profiles (you'll need to replace UUIDs with actual auth.users IDs)
INSERT INTO public.profiles (id, role_id, full_name, location, phone, email, is_approved) VALUES
    ('11111111-1111-1111-1111-111111111111', 1, 'Raj Kumar', ST_GeogFromText('POINT(77.2090 28.6139)'), '+91-9876543210', 'raj@vendor.com', true),
    ('22222222-2222-2222-2222-222222222222', 2, 'Priya Supplies', ST_GeogFromText('POINT(77.2167 28.6448)'), '+91-9876543211', 'priya@supplier.com', true),
    ('33333333-3333-3333-3333-333333333333', 3, 'Delivery Agent Ali', ST_GeogFromText('POINT(77.2310 28.6520)'), '+91-9876543212', 'ali@agent.com', true);

-- Sample products
INSERT INTO public.products (supplier_id, name, description, unit, base_price, img_emoji) VALUES
    ('22222222-2222-2222-2222-222222222222', 'Basmati Rice', 'Premium quality basmati rice', 'kg', 120.00, '🍚'),
    ('22222222-2222-2222-2222-222222222222', 'Cooking Oil', 'Refined sunflower oil', 'liter', 180.00, '🛢️'),
    ('22222222-2222-2222-2222-222222222222', 'Onions', 'Fresh red onions', 'kg', 45.00, '🧅');

-- Sample deals
INSERT INTO public.deals (product_id, threshold, discount) VALUES
    ((SELECT id FROM public.products WHERE name = 'Basmati Rice'), 10, 0.05),
    ((SELECT id FROM public.products WHERE name = 'Basmati Rice'), 25, 0.10),
    ((SELECT id FROM public.products WHERE name = 'Cooking Oil'), 5, 0.08),
    ((SELECT id FROM public.products WHERE name = 'Onions'), 20, 0.12);
*/

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
-- This schema provides:
-- 1. Role-based user management with admin approval for suppliers
-- 2. Geographic location support for vendors and suppliers
-- 3. Product catalog with emoji representations
-- 4. Flexible bulk discount system with automatic price calculation
-- 5. Shopping cart functionality with finalization workflow
-- 6. Comprehensive security policies and data integrity constraints
-- 7. Performance optimizations through strategic indexing
-- 8. Audit trails with timestamps
-- 9. Business logic functions for price calculations
