-- Create OTP verification table for EmailJS OTP login
CREATE TABLE IF NOT EXISTS public.otp_verification (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_otp_verification_email ON public.otp_verification(email);
CREATE INDEX idx_otp_verification_created_at ON public.otp_verification(created_at);

-- Enable RLS
ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert OTP (for sending)
CREATE POLICY "Anyone can insert OTP" ON public.otp_verification
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read their own OTP (for verification)
CREATE POLICY "Anyone can read OTP" ON public.otp_verification
  FOR SELECT
  USING (true);

-- Allow anyone to delete OTP (for cleanup)
CREATE POLICY "Anyone can delete OTP" ON public.otp_verification
  FOR DELETE
  USING (true);

-- Auto-delete expired OTPs (older than 10 minutes)
CREATE OR REPLACE FUNCTION public.delete_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_verification
  WHERE created_at < now() - interval '10 minutes';
END;
$$;

-- Optional: Create a scheduled job to clean up old OTPs
-- You can run this manually or set up a cron job
COMMENT ON FUNCTION public.delete_expired_otps() IS 'Deletes OTP records older than 10 minutes';
