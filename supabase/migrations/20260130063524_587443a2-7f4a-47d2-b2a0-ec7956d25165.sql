-- =============================================
-- FOOD DELIVERY BACKEND - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. Create role enum type
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('customer', 'vendor', 'delivery_partner', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create order status enum
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create delivery status enum
DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create transaction status enum
DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Create refund status enum
DO $$ BEGIN
  CREATE TYPE public.refund_status AS ENUM ('pending', 'approved', 'rejected', 'processed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- USER ROLES TABLE (Separate from profiles for security)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- VENDORS TABLE (Extended vendor info)
-- =============================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  license_number TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- DELIVERY PARTNERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  vehicle_number TEXT,
  current_latitude NUMERIC(10,7),
  current_longitude NUMERIC(10,7),
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- STORES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  banner_url TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0,
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- MENU CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- MENU ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_veg BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 15, -- in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  delivery_latitude NUMERIC(10,7),
  delivery_longitude NUMERIC(10,7),
  notes TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_order NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- DELIVERY ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  delivery_partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  status delivery_status NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- REFUNDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status refund_status NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is vendor
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'vendor')
$$;

-- Check if current user is delivery partner
CREATE OR REPLACE FUNCTION public.is_delivery_partner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'delivery_partner')
$$;

-- Check if user owns a store
CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND vendor_id = auth.uid()
  )
$$;

-- Check if user is the order's customer
CREATE OR REPLACE FUNCTION public.is_order_customer(_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id AND customer_id = auth.uid()
  )
$$;

-- Check if vendor owns the order's store
CREATE OR REPLACE FUNCTION public.is_order_vendor(_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON o.store_id = s.id
    WHERE o.id = _order_id AND s.vendor_id = auth.uid()
  )
$$;

-- Check if delivery partner is assigned to order
CREATE OR REPLACE FUNCTION public.is_order_delivery_partner(_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_assignments
    WHERE order_id = _order_id AND delivery_partner_id = auth.uid()
  )
$$;

-- =============================================
-- RLS POLICIES - USER ROLES
-- =============================================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- =============================================
-- RLS POLICIES - VENDORS
-- =============================================
DROP POLICY IF EXISTS "Vendors visible to all authenticated" ON public.vendors;
CREATE POLICY "Vendors visible to all authenticated" ON public.vendors
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Vendors can insert own record" ON public.vendors;
CREATE POLICY "Vendors can insert own record" ON public.vendors
  FOR INSERT WITH CHECK (id = auth.uid() AND public.has_role(auth.uid(), 'vendor'));

DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
CREATE POLICY "Admins can insert vendors" ON public.vendors
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Vendors can update own record" ON public.vendors;
CREATE POLICY "Vendors can update own record" ON public.vendors
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;
CREATE POLICY "Admins can delete vendors" ON public.vendors
  FOR DELETE USING (public.is_admin());

-- =============================================
-- RLS POLICIES - DELIVERY PARTNERS
-- =============================================
DROP POLICY IF EXISTS "Delivery partners visible to admins and self" ON public.delivery_partners;
CREATE POLICY "Delivery partners visible to admins and self" ON public.delivery_partners
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Delivery partners can insert own record" ON public.delivery_partners;
CREATE POLICY "Delivery partners can insert own record" ON public.delivery_partners
  FOR INSERT WITH CHECK (id = auth.uid() AND public.has_role(auth.uid(), 'delivery_partner'));

DROP POLICY IF EXISTS "Admins can insert delivery partners" ON public.delivery_partners;
CREATE POLICY "Admins can insert delivery partners" ON public.delivery_partners
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Delivery partners can update own record" ON public.delivery_partners;
CREATE POLICY "Delivery partners can update own record" ON public.delivery_partners
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete delivery partners" ON public.delivery_partners;
CREATE POLICY "Admins can delete delivery partners" ON public.delivery_partners
  FOR DELETE USING (public.is_admin());

-- =============================================
-- RLS POLICIES - STORES
-- =============================================
DROP POLICY IF EXISTS "Active stores visible to all authenticated" ON public.stores;
CREATE POLICY "Active stores visible to all authenticated" ON public.stores
  FOR SELECT USING (is_active = true OR vendor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Vendors can create stores" ON public.stores;
CREATE POLICY "Vendors can create stores" ON public.stores
  FOR INSERT WITH CHECK (vendor_id = auth.uid() AND public.has_role(auth.uid(), 'vendor'));

DROP POLICY IF EXISTS "Vendors can update own stores" ON public.stores;
CREATE POLICY "Vendors can update own stores" ON public.stores
  FOR UPDATE USING (vendor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Vendors and admins can delete stores" ON public.stores;
CREATE POLICY "Vendors and admins can delete stores" ON public.stores
  FOR DELETE USING (vendor_id = auth.uid() OR public.is_admin());

-- =============================================
-- RLS POLICIES - MENU CATEGORIES
-- =============================================
DROP POLICY IF EXISTS "Categories visible with store" ON public.menu_categories;
CREATE POLICY "Categories visible with store" ON public.menu_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND (is_active = true OR vendor_id = auth.uid()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Store owners can create categories" ON public.menu_categories;
CREATE POLICY "Store owners can create categories" ON public.menu_categories
  FOR INSERT WITH CHECK (public.is_store_owner(store_id));

DROP POLICY IF EXISTS "Store owners can update categories" ON public.menu_categories;
CREATE POLICY "Store owners can update categories" ON public.menu_categories
  FOR UPDATE USING (public.is_store_owner(store_id) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can delete categories" ON public.menu_categories;
CREATE POLICY "Store owners can delete categories" ON public.menu_categories
  FOR DELETE USING (public.is_store_owner(store_id) OR public.is_admin());

-- =============================================
-- RLS POLICIES - MENU ITEMS
-- =============================================
DROP POLICY IF EXISTS "Available items visible to all authenticated" ON public.menu_items;
CREATE POLICY "Available items visible to all authenticated" ON public.menu_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND is_active = true)
    OR public.is_store_owner(store_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Store owners can create items" ON public.menu_items;
CREATE POLICY "Store owners can create items" ON public.menu_items
  FOR INSERT WITH CHECK (public.is_store_owner(store_id));

DROP POLICY IF EXISTS "Store owners can update items" ON public.menu_items;
CREATE POLICY "Store owners can update items" ON public.menu_items
  FOR UPDATE USING (public.is_store_owner(store_id) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can delete items" ON public.menu_items;
CREATE POLICY "Store owners can delete items" ON public.menu_items
  FOR DELETE USING (public.is_store_owner(store_id) OR public.is_admin());

-- =============================================
-- RLS POLICIES - ORDERS
-- =============================================
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid()
    OR public.is_order_vendor(id)
    OR public.is_order_delivery_partner(id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Order updates by stakeholders" ON public.orders;
CREATE POLICY "Order updates by stakeholders" ON public.orders
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR public.is_order_vendor(id)
    OR public.is_order_delivery_partner(id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (public.is_admin());

-- =============================================
-- RLS POLICIES - ORDER ITEMS
-- =============================================
DROP POLICY IF EXISTS "Order items visible with order" ON public.order_items;
CREATE POLICY "Order items visible with order" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid()
        OR public.is_order_vendor(o.id)
        OR public.is_order_delivery_partner(o.id)
        OR public.is_admin()
      )
    )
  );

DROP POLICY IF EXISTS "Customers can add order items" ON public.order_items;
CREATE POLICY "Customers can add order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL USING (public.is_admin());

-- =============================================
-- RLS POLICIES - DELIVERY ASSIGNMENTS
-- =============================================
-- SINGLE SELECT policy that covers ALL cases (combining all conditions with OR)
DROP POLICY IF EXISTS "Delivery assignments visible to stakeholders" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Available delivery partners can view pending" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Delivery assignments visible to all authorized" ON public.delivery_assignments;
CREATE POLICY "Delivery assignments visible to all authorized" ON public.delivery_assignments
  FOR SELECT USING (
    -- Assigned delivery partner can see their orders
    delivery_partner_id = auth.uid()
    -- Vendor can see orders for their stores
    OR public.is_order_vendor(order_id)
    -- Customer can see their own orders
    OR public.is_order_customer(order_id)
    -- Admin can see everything
    OR public.is_admin()
    -- VERIFIED and ONLINE delivery partners can see UNASSIGNED pending orders
    OR (
      status = 'pending' 
      AND delivery_partner_id IS NULL
      AND public.has_role(auth.uid(), 'delivery_partner')
      AND EXISTS (
        SELECT 1 FROM public.delivery_partners 
        WHERE id = auth.uid() 
        AND is_verified = true
        AND is_available = true
      )
    )
  );

DROP POLICY IF EXISTS "System and vendors can create assignments" ON public.delivery_assignments;
CREATE POLICY "System and vendors can create assignments" ON public.delivery_assignments
  FOR INSERT WITH CHECK (
    public.is_order_vendor(order_id) 
    OR public.is_order_customer(order_id) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Delivery partners can update assigned orders" ON public.delivery_assignments;
CREATE POLICY "Delivery partners can update assigned orders" ON public.delivery_assignments
  FOR UPDATE USING (
    -- Delivery partner can update pending assignments (to accept them)
    (status = 'pending' AND delivery_partner_id IS NULL AND public.has_role(auth.uid(), 'delivery_partner'))
    -- Assigned delivery partner can update their own
    OR delivery_partner_id = auth.uid() 
    -- Admin can update anything
    OR public.is_admin()
  );

-- =============================================
-- RLS POLICIES - TRANSACTIONS
-- =============================================
DROP POLICY IF EXISTS "Customers can view own transactions" ON public.transactions;
CREATE POLICY "Customers can view own transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Only admins can manage transactions" ON public.transactions;
CREATE POLICY "Only admins can manage transactions" ON public.transactions
  FOR ALL USING (public.is_admin());

-- =============================================
-- RLS POLICIES - REFUNDS
-- =============================================
DROP POLICY IF EXISTS "Customers can view own refunds" ON public.refunds;
CREATE POLICY "Customers can view own refunds" ON public.refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Only admins can manage refunds" ON public.refunds;
CREATE POLICY "Only admins can manage refunds" ON public.refunds
  FOR ALL USING (public.is_admin());

-- =============================================
-- RLS POLICIES - NOTIFICATIONS
-- =============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''));
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_delivery_partners_updated_at
  BEFORE UPDATE ON public.delivery_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_delivery_assignments_updated_at
  BEFORE UPDATE ON public.delivery_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- AUTO-CREATE DELIVERY ASSIGNMENT WHEN ORDER IS READY/DISPATCHED
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_create_delivery_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status changes to 'ready' or 'dispatched'
  -- and no delivery_assignment exists, create one
  IF (NEW.status IN ('ready', 'dispatched') AND 
      (OLD.status IS NULL OR OLD.status NOT IN ('ready', 'dispatched'))) THEN
    
    -- Check if assignment already exists
    IF NOT EXISTS (SELECT 1 FROM delivery_assignments WHERE order_id = NEW.id) THEN
      INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
      VALUES (NEW.id, 'pending', NULL);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_ready_for_delivery ON public.orders;
CREATE TRIGGER on_order_ready_for_delivery
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_delivery_assignment();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_stores_vendor_id ON public.stores(vendor_id);
CREATE INDEX idx_stores_is_active ON public.stores(is_active);
CREATE INDEX idx_menu_items_store_id ON public.menu_items(store_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON public.menu_items(is_available);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_delivery_assignments_order_id ON public.delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_partner_id ON public.delivery_assignments(delivery_partner_id);
CREATE INDEX idx_delivery_assignments_status ON public.delivery_assignments(status);
CREATE INDEX idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);