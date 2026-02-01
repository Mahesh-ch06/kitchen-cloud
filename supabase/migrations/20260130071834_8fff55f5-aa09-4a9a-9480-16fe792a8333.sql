-- Update existing user to admin role
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '00eb9e8f-1fc0-4fc7-bf2d-38a92de30425';