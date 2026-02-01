-- ================================================
-- CLEAN FIX: Remove duplicate policies and verify data
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Remove ALL policies on delivery_assignments
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'delivery_assignments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON delivery_assignments', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Create single open SELECT policy
CREATE POLICY "open_select" ON delivery_assignments
FOR SELECT TO authenticated USING (true);

-- Step 3: Create single open UPDATE policy
CREATE POLICY "open_update" ON delivery_assignments
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Step 4: Create single open INSERT policy
CREATE POLICY "open_insert" ON delivery_assignments
FOR INSERT TO authenticated WITH CHECK (true);

-- Step 5: Enable RLS
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Step 6: Set ALL delivery partners as verified and available
UPDATE delivery_partners
SET is_verified = true, is_available = true;

-- Step 7: Show delivery partners
SELECT 'DELIVERY PARTNERS:' as info;
SELECT id, is_verified, is_available FROM delivery_partners;

-- Step 8: Show dispatched orders
SELECT 'DISPATCHED ORDERS:' as info;
SELECT id, status, total_amount, created_at 
FROM orders 
WHERE status IN ('ready', 'dispatched')
ORDER BY created_at DESC;

-- Step 9: Show delivery_assignments
SELECT 'DELIVERY ASSIGNMENTS:' as info;
SELECT 
  da.id,
  da.order_id,
  da.status,
  da.delivery_partner_id,
  o.status as order_status
FROM delivery_assignments da
LEFT JOIN orders o ON o.id = da.order_id
ORDER BY da.created_at DESC;

-- Step 10: Create missing assignments for dispatched orders
INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
SELECT o.id, 'pending', NULL
FROM orders o
WHERE o.status IN ('ready', 'dispatched')
  AND NOT EXISTS (
    SELECT 1 FROM delivery_assignments da WHERE da.order_id = o.id
  );

-- Step 11: Show assignments again after fix
SELECT 'ASSIGNMENTS AFTER FIX:' as info;
SELECT 
  da.id as assignment_id,
  da.order_id,
  da.status as assignment_status,
  o.status as order_status,
  o.total_amount
FROM delivery_assignments da
JOIN orders o ON o.id = da.order_id
WHERE da.status = 'pending' AND da.delivery_partner_id IS NULL;

-- Step 12: Verify policies
SELECT 'POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'delivery_assignments';
