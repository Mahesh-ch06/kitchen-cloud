-- Create a function to assign admin role to specific email
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the new user has the admin email, update their role to admin
  IF NEW.email = 'maheshch1094@gmail.com' THEN
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after profile is created
DROP TRIGGER IF EXISTS assign_admin_trigger ON public.profiles;
CREATE TRIGGER assign_admin_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_on_signup();