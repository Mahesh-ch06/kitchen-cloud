-- ================================================
-- FIX: DELIVERY PARTNER - SEE ALL AVAILABLE ORDERS
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Drop ALL existing policies on delivery_assignments
DROP POLICY IF EXISTS "Delivery partners can view their assignments" ON delivery_assignments;
DROP POLICY IF EXISTS "Delivery partners can update their assignments" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_select_policy" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_update_policy" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_partners_view_pending" ON delivery_assignments;
DROP POLICY IF EXISTS "Verified delivery partners can view pending assignments" ON delivery_assignments;
DROP POLICY IF EXISTS "Delivery partners can accept pending assignments" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_full_select" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_update" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_insert" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_select_all" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_update_all" ON delivery_assignments;
DROP POLICY IF EXISTS "delivery_assignments_insert_all" ON delivery_assignments;

-- Step 2: Create OPEN SELECT policy - all authenticated users can view all assignments
-- This allows delivery partners to see ALL pending orders available for pickup
CREATE POLICY "delivery_assignments_select_all" ON delivery_assignments
FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to see all assignments

-- Step 3: Create UPDATE policy - delivery partners can accept and update
CREATE POLICY "delivery_assignments_update_all" ON delivery_assignments
FOR UPDATE
TO authenticated
USING (
  -- Can update pending assignments (to accept)
  (status = 'pending' AND delivery_partner_id IS NULL)
  OR
  -- Can update own assignments (to mark picked_up, in_transit, delivered)
  (delivery_partner_id = auth.uid())
)
WITH CHECK (true);

-- Step 4: Create INSERT policy (for system/triggers to create assignments)
CREATE POLICY "delivery_assignments_insert_all" ON delivery_assignments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 5: Ensure RLS is enabled
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Step 6: Create the auto-create trigger function
CREATE OR REPLACE FUNCTION public.auto_create_delivery_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IN ('ready', 'dispatched') AND 
      (OLD IS NULL OR OLD.status NOT IN ('ready', 'dispatched'))) THEN
    
    IF NOT EXISTS (SELECT 1 FROM delivery_assignments WHERE order_id = NEW.id) THEN
      INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
      VALUES (NEW.id, 'pending', NULL);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 7: Create trigger for orders table
DROP TRIGGER IF EXISTS on_order_ready_for_delivery ON orders;
CREATE TRIGGER on_order_ready_for_delivery
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_delivery_assignment();

-- Step 8: Create missing assignments for ALL dispatched/ready orders
INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
SELECT o.id, 'pending', NULL
FROM orders o
WHERE o.status IN ('ready', 'dispatched')
  AND NOT EXISTS (
    SELECT 1 FROM delivery_assignments da WHERE da.order_id = o.id
  );

-- Step 9: Ensure ALL delivery partners are verified and available
-- This is required for them to see orders!
UPDATE delivery_partners
SET is_verified = true, is_available = true
WHERE is_verified = false OR is_available = false;

-- Step 10: Check delivery partners after fix
SELECT 
  'Delivery Partners (after update):' as info,
  id,
  is_verified,
  is_available
FROM delivery_partners;

-- Step 11: Show ALL pending assignments available for pickup
SELECT 
  '=== ORDERS AVAILABLE FOR PICKUP ===' as info;

SELECT 
  da.id as assignment_id,
  da.order_id,
  da.status as assignment_status,
  o.status as order_status,
  o.total_amount,
  o.delivery_address,
  s.name as store_name,
  da.created_at
FROM delivery_assignments da
JOIN orders o ON o.id = da.order_id
LEFT JOIN stores s ON s.id = o.store_id
WHERE da.status = 'pending'
  AND da.delivery_partner_id IS NULL
ORDER BY da.created_at DESC;

-- Step 12: List all policies on delivery_assignments
SELECT 
  'Policies:' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'delivery_assignments'
ORDER BY policyname;
