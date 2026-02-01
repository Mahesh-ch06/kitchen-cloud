-- Check delivery partner status
SELECT 
  dp.id,
  p.first_name,
  p.last_name,
  dp.is_available,
  dp.is_verified,
  dp.rating,
  dp.created_at
FROM delivery_partners dp
LEFT JOIN profiles p ON p.id = dp.id
ORDER BY dp.created_at DESC;

-- Check pending delivery assignments
SELECT 
  da.id,
  da.order_id,
  da.status,
  da.delivery_partner_id,
  o.total_amount,
  o.delivery_address,
  s.name as store_name,
  da.created_at
FROM delivery_assignments da
LEFT JOIN orders o ON o.id = da.order_id
LEFT JOIN stores s ON s.id = o.store_id
WHERE da.status = 'pending' 
  AND da.delivery_partner_id IS NULL
ORDER BY da.created_at DESC
LIMIT 10;

-- Check user roles
SELECT 
  ur.user_id,
  ur.role,
  p.first_name,
  p.last_name,
  p.email
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
WHERE ur.role = 'delivery_partner'
ORDER BY ur.created_at DESC;
