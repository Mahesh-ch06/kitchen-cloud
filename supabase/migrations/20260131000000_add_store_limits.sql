-- =============================================
-- ADD STORE LIMITS AND REQUEST SYSTEM
-- =============================================

-- Add max_stores column to vendors table (default 2 stores per vendor)
ALTER TABLE public.vendors
ADD COLUMN max_stores INTEGER NOT NULL DEFAULT 2;

-- Create store_limit_requests table for vendors to request more stores
CREATE TABLE public.store_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  current_limit INTEGER NOT NULL,
  requested_limit INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on vendor_id for faster lookups
CREATE INDEX idx_store_limit_requests_vendor_id ON public.store_limit_requests(vendor_id);
CREATE INDEX idx_store_limit_requests_status ON public.store_limit_requests(status);

-- Enable RLS
ALTER TABLE public.store_limit_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_limit_requests

-- Vendors can view their own requests
CREATE POLICY "Vendors can view own requests"
  ON public.store_limit_requests
  FOR SELECT
  USING (
    vendor_id = auth.uid()
  );

-- Vendors can create their own requests
CREATE POLICY "Vendors can create own requests"
  ON public.store_limit_requests
  FOR INSERT
  WITH CHECK (
    vendor_id = auth.uid()
  );

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON public.store_limit_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
  ON public.store_limit_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update vendor's max_stores when request is approved
CREATE OR REPLACE FUNCTION update_vendor_max_stores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.vendors
    SET max_stores = NEW.requested_limit,
        updated_at = now()
    WHERE id = NEW.vendor_id;
    
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update vendor max_stores on approval
CREATE TRIGGER on_store_limit_request_approved
  BEFORE UPDATE ON public.store_limit_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_max_stores();

-- Add comment to explain the system
COMMENT ON TABLE public.store_limit_requests IS 'Tracks vendor requests to increase their store creation limit';
COMMENT ON COLUMN public.vendors.max_stores IS 'Maximum number of stores a vendor can create (default: 2)';
