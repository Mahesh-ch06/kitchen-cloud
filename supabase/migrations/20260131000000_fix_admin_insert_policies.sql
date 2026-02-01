-- Add admin INSERT policies for vendors and delivery_partners tables
-- This fixes 403 errors when admins try to create these records via role changes

-- Add admin INSERT policy for vendors
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
CREATE POLICY "Admins can insert vendors" ON public.vendors
  FOR INSERT WITH CHECK (public.is_admin());

-- Add admin INSERT policy for delivery_partners
DROP POLICY IF EXISTS "Admins can insert delivery partners" ON public.delivery_partners;
CREATE POLICY "Admins can insert delivery partners" ON public.delivery_partners
  FOR INSERT WITH CHECK (public.is_admin());
