-- ================================================
-- CRITICAL FIX: Enable delivery partners to see pending orders
-- Run this in Supabase SQL Editor NOW
-- ================================================

-- Step 1: Drop ALL existing policies on delivery_assignments
DROP POLICY IF EXISTS "Available delivery partners can view pending" ON public.delivery_assignments;
DROP POLICY IF EXISTS "System and vendors can create assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Delivery assignments visible to stakeholders" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Delivery partners can update assigned orders" ON public.delivery_assignments;

-- Step 2: Recreate ALL policies with PERMISSIVE logic

-- SINGLE SELECT policy that covers ALL cases (combining all conditions with OR)
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

-- Allow customers, vendors, admins to create delivery assignments
CREATE POLICY "System and vendors can create assignments" ON public.delivery_assignments
  FOR INSERT WITH CHECK (
    public.is_order_vendor(order_id) 
    OR public.is_order_customer(order_id) 
    OR public.is_admin()
  );

-- Allow delivery partners to update (accept) and admins to update assignments
CREATE POLICY "Delivery partners can update assigned orders" ON public.delivery_assignments
  FOR UPDATE USING (
    -- Delivery partner can update pending assignments (to accept them)
    (status = 'pending' AND delivery_partner_id IS NULL AND public.has_role(auth.uid(), 'delivery_partner'))
    -- Assigned delivery partner can update their own
    OR delivery_partner_id = auth.uid() 
    -- Admin can update anything
    OR public.is_admin()
  );

-- ================================================
-- VERIFICATION QUERIES - Check each step
-- ================================================

-- 1. Check your current user ID
SELECT 
  'Step 1: Your User ID' as step,
  auth.uid() as your_user_id;

-- 2. Check your delivery partner record
SELECT 
  'Step 2: Delivery Partner Record' as step,
  id,
  is_verified,
  is_available,
  vehicle_type,
  rating,
  CASE 
    WHEN is_verified AND is_available THEN '✓ READY TO RECEIVE ORDERS'
    WHEN NOT is_verified THEN '✗ NOT VERIFIED - Go to Admin Portal to verify'
    WHEN NOT is_available THEN '✗ OFFLINE - Toggle to Online'
    ELSE '✗ UNKNOWN ISSUE'
  END as status_message
FROM delivery_partners 
WHERE id = auth.uid();

-- 3. Check your roles
SELECT 
  'Step 3: Your Roles' as step,
  role,
  CASE 
    WHEN role = 'delivery_partner' THEN '✓ Has delivery_partner role'
    ELSE '✗ Missing delivery_partner role'
  END as role_check
FROM user_roles 
WHERE user_id = auth.uid();

-- 4. Test has_role function
SELECT 
  'Step 4: Role Function Test' as step,
  public.has_role(auth.uid(), 'delivery_partner') as has_delivery_role,
  CASE 
    WHEN public.has_role(auth.uid(), 'delivery_partner') THEN '✓ Function returns TRUE'
    ELSE '✗ Function returns FALSE'
  END as function_check;

-- 5. Show ALL pending delivery assignments (raw data)
SELECT 
  'Step 5: ALL Pending Assignments' as step,
  da.id as assignment_id,
  da.order_id,
  da.status,
  da.delivery_partner_id,
  o.total_amount,
  LEFT(o.delivery_address, 50) as delivery_address,
  o.status as order_status,
  s.name as store_name,
  o.created_at
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
JOIN stores s ON o.store_id = s.id
WHERE da.status = 'pending' 
  AND da.delivery_partner_id IS NULL
ORDER BY da.created_at DESC;

-- 6. Test the exact policy condition
SELECT 
  'Step 6: Policy Condition Test' as step,
  EXISTS (
    SELECT 1 FROM public.delivery_partners 
    WHERE id = auth.uid() 
    AND is_verified = true
    AND is_available = true
  ) as passes_exists_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.delivery_partners 
      WHERE id = auth.uid() 
      AND is_verified = true
      AND is_available = true
    ) THEN '✓ You should see pending orders'
    ELSE '✗ You do NOT meet the requirements (must be verified AND online)'
  END as verdict;

-- 7. Try to SELECT from delivery_assignments directly
SELECT 
  'Step 7: What YOU can see' as step,
  COUNT(*) as orders_visible_to_you
FROM delivery_assignments
WHERE status = 'pending' 
  AND delivery_partner_id IS NULL;

-- 8. Check all policies on delivery_assignments table
SELECT 
  'Step 8: Current Policies' as step,
  policyname,
  cmd as command,
  permissive,
  roles,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'delivery_assignments'
ORDER BY policyname;
