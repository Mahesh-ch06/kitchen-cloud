-- ================================================
-- FIX ORDERS TABLE RLS FOR DELIVERY PARTNERS
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Check current policies on orders table
SELECT 'CURRENT ORDER POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders';

-- Step 2: Drop restrictive order policies
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Vendors can view orders for their stores" ON orders;

-- Step 3: Create open SELECT policy for orders
-- Delivery partners need to see order details to pick them up
CREATE POLICY "orders_open_select" ON orders
FOR SELECT TO authenticated USING (true);

-- Step 4: Check delivery_assignments with order data
SELECT 'DELIVERY ASSIGNMENTS WITH ORDERS:' as info;
SELECT 
  da.id as assignment_id,
  da.order_id,
  da.status as assignment_status,
  da.delivery_partner_id,
  o.id as order_exists,
  o.status as order_status,
  o.total_amount
FROM delivery_assignments da
LEFT JOIN orders o ON o.id = da.order_id
WHERE da.status = 'pending' AND da.delivery_partner_id IS NULL
ORDER BY da.created_at DESC;

-- Step 5: Verify new policies
SELECT 'NEW POLICIES:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders';
