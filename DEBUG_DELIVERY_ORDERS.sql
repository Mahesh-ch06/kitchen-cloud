-- DEBUG: Check why delivery orders are not showing
-- Run this in Supabase SQL Editor

-- Step 1: Check orders that are dispatched
SELECT 
  id,
  status,
  total_amount,
  delivery_address,
  created_at
FROM orders 
WHERE status IN ('ready', 'dispatched')
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check if delivery_assignments exist for these orders
SELECT 
  da.id as assignment_id,
  da.order_id,
  da.delivery_partner_id,
  da.status as assignment_status,
  o.status as order_status,
  da.created_at
FROM delivery_assignments da
JOIN orders o ON o.id = da.order_id
WHERE o.status IN ('ready', 'dispatched')
ORDER BY da.created_at DESC
LIMIT 10;

-- Step 3: Check for orders WITHOUT delivery_assignments
SELECT 
  o.id,
  o.status,
  o.created_at,
  'NO ASSIGNMENT' as issue
FROM orders o
LEFT JOIN delivery_assignments da ON da.order_id = o.id
WHERE o.status IN ('ready', 'dispatched')
  AND da.id IS NULL;

-- Step 4: Check delivery_assignments table for pending ones
SELECT 
  da.*,
  o.status as order_status
FROM delivery_assignments da
LEFT JOIN orders o ON o.id = da.order_id
WHERE da.status = 'pending' 
  AND da.delivery_partner_id IS NULL
ORDER BY da.created_at DESC;

-- Step 5: Check RLS policies on delivery_assignments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'delivery_assignments';

-- Step 6: Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_delivery_assignment';

-- =====================================================
-- FIX: Create missing delivery_assignments for existing orders
-- =====================================================

-- Create delivery assignments for orders that don't have one
INSERT INTO delivery_assignments (order_id, status)
SELECT o.id, 'pending'
FROM orders o
LEFT JOIN delivery_assignments da ON da.order_id = o.id
WHERE o.status IN ('ready', 'dispatched')
  AND da.id IS NULL;

-- Check again after fix
SELECT 
  da.id as assignment_id,
  da.order_id,
  da.delivery_partner_id,
  da.status as assignment_status,
  o.status as order_status
FROM delivery_assignments da
JOIN orders o ON o.id = da.order_id
WHERE o.status IN ('ready', 'dispatched')
  AND da.status = 'pending'
  AND da.delivery_partner_id IS NULL;
