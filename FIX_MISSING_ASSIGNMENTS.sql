-- ================================================
-- FIX: Create missing delivery_assignments for dispatched orders
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Check which orders are missing delivery_assignments
SELECT 
  'Orders WITHOUT delivery_assignment' as info,
  o.id as order_id,
  o.status,
  o.total_amount,
  o.delivery_address
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_assignments da WHERE da.order_id = o.id
)
AND o.status IN ('ready', 'dispatched');

-- Step 2: Create delivery_assignments for ALL orders that don't have one
INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
SELECT 
  o.id,
  'pending',
  NULL
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_assignments da WHERE da.order_id = o.id
)
ON CONFLICT (order_id) DO NOTHING;

-- Step 3: Verify the assignments now exist
SELECT 
  'Pending assignments for dispatched orders' as info,
  da.id as assignment_id,
  da.order_id,
  da.status as assignment_status,
  da.delivery_partner_id,
  o.status as order_status,
  o.total_amount,
  o.delivery_address
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
WHERE da.status = 'pending'
  AND da.delivery_partner_id IS NULL
  AND o.status IN ('ready', 'dispatched')
ORDER BY o.created_at DESC;
