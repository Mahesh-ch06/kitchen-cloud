-- Clean up duplicate user_roles and fix any delivery partners that were created as customers
-- Run this if you have existing delivery partner accounts that were created incorrectly

-- 1. Find users who have both customer and delivery_partner roles
SELECT 
  ur.user_id,
  p.email,
  STRING_AGG(ur.role::text, ', ') as roles
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
GROUP BY ur.user_id, p.email
HAVING COUNT(*) > 1;

-- 2. For users with delivery_partners record, keep only delivery_partner role
DELETE FROM user_roles
WHERE user_id IN (
  SELECT dp.id 
  FROM delivery_partners dp
)
AND role = 'customer';

-- 3. For any delivery partners without the delivery_partner role, add it
INSERT INTO user_roles (user_id, role)
SELECT dp.id, 'delivery_partner'
FROM delivery_partners dp
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = dp.id 
  AND ur.role = 'delivery_partner'
);

-- 4. Verify - this should show all delivery partners with their correct role
SELECT 
  dp.id,
  p.first_name,
  p.last_name,
  p.email,
  ur.role,
  dp.is_verified,
  dp.is_available
FROM delivery_partners dp
LEFT JOIN profiles p ON p.id = dp.id
LEFT JOIN user_roles ur ON ur.user_id = dp.id
ORDER BY dp.created_at DESC;
