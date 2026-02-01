-- ========================================
-- RUN THIS SQL IN SUPABASE SQL EDITOR NOW
-- ========================================
-- This will fix ALL issues:
-- 1. Role change errors (403 Forbidden)
-- 2. Delivery partners not seeing orders
-- 3. Customers not able to create delivery assignments

-- Copy all of this and paste into Supabase Dashboard → SQL Editor → Run

-- Step 1: Ensure helper functions exist
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, check_role text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role::text = $2
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Step 2: Add admin INSERT policy for vendors table
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
CREATE POLICY "Admins can insert vendors" ON public.vendors
  FOR INSERT WITH CHECK (public.is_admin());

-- Step 3: Add admin INSERT policy for delivery_partners table
DROP POLICY IF EXISTS "Admins can insert delivery partners" ON public.delivery_partners;
CREATE POLICY "Admins can insert delivery partners" ON public.delivery_partners
  FOR INSERT WITH CHECK (public.is_admin());

-- Step 4: Fix delivery_assignments INSERT policy - allow customers to create assignments
DROP POLICY IF EXISTS "System and vendors can create assignments" ON public.delivery_assignments;
CREATE POLICY "System and vendors can create assignments" ON public.delivery_assignments
  FOR INSERT WITH CHECK (
    public.is_order_vendor(order_id) 
    OR public.is_order_customer(order_id) 
    OR public.is_admin()
  );

-- Step 5: Fix delivery partners viewing pending orders - allow ALL verified delivery partners to see pending
DROP POLICY IF EXISTS "Available delivery partners can view pending" ON public.delivery_assignments;
CREATE POLICY "Available delivery partners can view pending" ON public.delivery_assignments
  FOR SELECT USING (
    status = 'pending' 
    AND delivery_partner_id IS NULL
    AND public.has_role(auth.uid(), 'delivery_partner')
    AND EXISTS (
      SELECT 1 FROM public.delivery_partners 
      WHERE id = auth.uid() 
      AND is_verified = true
      AND is_available = true
    )
  );

-- Step 6: Verify the policies were created successfully
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('vendors', 'delivery_partners', 'delivery_assignments')
  AND (
    policyname LIKE '%Admins can insert%' 
    OR policyname LIKE '%can create assignments%'
    OR policyname LIKE '%can view pending%'
  )
ORDER BY tablename, policyname;

-- Step 7: Test if current user is admin
SELECT 
  auth.uid() as your_user_id,
  public.is_admin() as you_are_admin,
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) as your_role;

-- Step 8: Check existing delivery assignments
SELECT 
  da.id,
  da.order_id,
  da.status,
  da.delivery_partner_id,
  o.total_amount,
  o.delivery_address,
  s.name as store_name,
  da.created_at
FROM delivery_assignments da
LEFT JOIN orders o ON o.id = da.order_id
LEFT JOIN stores s ON s.id = o.store_id
WHERE da.status = 'pending' AND da.delivery_partner_id IS NULL
ORDER BY da.created_at DESC
LIMIT 10;

-- If you see orders in Step 8, the delivery partners should now be able to see them!
