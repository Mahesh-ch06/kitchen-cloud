-- Check if delivery partners are being created correctly

-- 1. View all delivery partners with their roles and profile info
SELECT 
  dp.id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  ur.role,
  dp.vehicle_type,
  dp.vehicle_number,
  dp.is_verified,
  dp.is_available,
  dp.created_at
FROM delivery_partners dp
LEFT JOIN profiles p ON p.id = dp.id
LEFT JOIN user_roles ur ON ur.user_id = dp.id
ORDER BY dp.created_at DESC;

-- 2. Check for users who have delivery_partners record but wrong role
SELECT 
  dp.id,
  p.email,
  ur.role as current_role,
  dp.is_verified
FROM delivery_partners dp
LEFT JOIN profiles p ON p.id = dp.id
LEFT JOIN user_roles ur ON ur.user_id = dp.id
WHERE ur.role != 'delivery_partner' OR ur.role IS NULL;

-- 3. Fix any delivery partners with wrong role
UPDATE user_roles
SET role = 'delivery_partner'
WHERE user_id IN (
  SELECT id FROM delivery_partners
)
AND role != 'delivery_partner';

-- 4. Count delivery partners by verification status
SELECT 
  is_verified,
  COUNT(*) as count
FROM delivery_partners
GROUP BY is_verified;
