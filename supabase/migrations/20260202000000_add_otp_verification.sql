-- Create a function to verify user exists and return user ID for OTP login
-- This is a simpler alternative to Edge Functions

-- First drop if exists
DROP FUNCTION IF EXISTS public.verify_user_for_otp(TEXT);

CREATE OR REPLACE FUNCTION public.verify_user_for_otp(email_to_verify TEXT)
RETURNS TABLE (user_id UUID, email_address TEXT, user_exists BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::TEXT as email_address,
    TRUE as user_exists
  FROM auth.users au
  WHERE au.email = email_to_verify
  LIMIT 1;
  
  -- If no rows found, return false
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::UUID as user_id,
      email_to_verify::TEXT as email_address,
      FALSE as user_exists;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_user_for_otp(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_user_for_otp(TEXT) TO authenticated;

-- Create function to get user profile for OTP login (bypasses RLS)
DROP FUNCTION IF EXISTS public.get_user_profile_for_otp(UUID);

CREATE OR REPLACE FUNCTION public.get_user_profile_for_otp(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.email::TEXT,
    p.phone::TEXT,
    p.avatar_url::TEXT,
    COALESCE(ur.role::TEXT, 'customer') as user_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = user_uuid
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile_for_otp(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_otp(UUID) TO authenticated;
