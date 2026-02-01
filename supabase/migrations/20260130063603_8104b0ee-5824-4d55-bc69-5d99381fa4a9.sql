-- Fix security warnings

-- 1. Fix function search_path for update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Fix overly permissive INSERT policy on notifications
-- Drop the old permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive policy - only admins and service role can create notifications
-- Notifications will be created via edge functions with service role
CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());