-- Test the new role change to delivery partner workflow
-- This script helps verify the complete workflow works correctly

-- STEP 1: Find a customer user to convert
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'customer'
ORDER BY p.created_at DESC
LIMIT 5;

-- STEP 2: After changing role in admin UI, verify the changes
-- Check that delivery_partners record was created
SELECT 
  dp.id,
  p.email,
  p.first_name,
  ur.role,
  dp.is_verified,
  dp.is_available,
  dp.created_at
FROM delivery_partners dp
LEFT JOIN profiles p ON p.id = dp.id
LEFT JOIN user_roles ur ON ur.user_id = dp.id
ORDER BY dp.created_at DESC
LIMIT 5;

-- STEP 3: Check unverified delivery partners (should appear in Verifications tab)
SELECT 
  dp.id,
  p.email,
  p.first_name || ' ' || p.last_name as name,
  ur.role,
  dp.is_verified,
  dp.vehicle_type,
  dp.vehicle_number
FROM delivery_partners dp
LEFT JOIN profiles p ON p.id = dp.id
LEFT JOIN user_roles ur ON ur.user_id = dp.id
WHERE dp.is_verified = false
ORDER BY dp.created_at DESC;

-- STEP 4: Manually verify a delivery partner (for testing)
UPDATE delivery_partners
SET is_verified = true
WHERE id = 'REPLACE_WITH_USER_ID';

-- STEP 5: Check if user can now login as delivery partner
SELECT 
  p.id,
  p.email,
  ur.role,
  dp.is_verified,
  dp.is_available
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN delivery_partners dp ON dp.id = p.id
WHERE p.id = 'REPLACE_WITH_USER_ID';
