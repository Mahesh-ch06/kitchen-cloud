-- ================================================
-- DIAGNOSTIC: Check why no orders are showing
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Check ALL delivery_assignments in the system
SELECT 
  'ALL Delivery Assignments' as check_name,
  da.id,
  da.order_id,
  da.status as assignment_status,
  da.delivery_partner_id,
  o.status as order_status,
  o.total_amount,
  s.name as store_name,
  o.created_at
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
JOIN stores s ON o.store_id = s.id
ORDER BY o.created_at DESC
LIMIT 20;

-- 2. Check ALL orders (even without delivery assignments)
SELECT 
  'ALL Orders' as check_name,
  o.id,
  o.status,
  o.total_amount,
  s.name as store_name,
  o.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM delivery_assignments WHERE order_id = o.id) 
    THEN 'Yes' 
    ELSE 'NO - Missing!' 
  END as has_delivery_assignment
FROM orders o
JOIN stores s ON o.store_id = s.id
ORDER BY o.created_at DESC
LIMIT 20;

-- 3. Count by status
SELECT 
  'Orders by Status' as check_name,
  status,
  COUNT(*) as count
FROM orders
GROUP BY status;

-- 4. Check delivery_assignments by status
SELECT 
  'Assignments by Status' as check_name,
  status,
  COUNT(*) as count
FROM delivery_assignments
GROUP BY status;

-- 5. Check specifically for PENDING assignments that are UNASSIGNED
SELECT 
  'Pending Unassigned Assignments' as check_name,
  da.id,
  da.order_id,
  o.status as order_status,
  o.total_amount
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
WHERE da.status = 'pending' 
  AND da.delivery_partner_id IS NULL;

-- 6. Check if your order #115d7cc1 exists
SELECT 
  'Order 115d7cc1 Check' as check_name,
  o.*
FROM orders o
WHERE o.id::text LIKE '115d7cc1%';
