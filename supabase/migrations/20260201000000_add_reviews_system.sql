-- =============================================
-- REVIEWS SYSTEM
-- =============================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, order_id) -- One review per customer per order
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers can create reviews for their orders" ON public.reviews;
CREATE POLICY "Customers can create reviews for their orders" ON public.reviews
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id 
      AND customer_id = auth.uid()
      AND status = 'delivered'
    )
  );

DROP POLICY IF EXISTS "Customers can update own reviews" ON public.reviews;
CREATE POLICY "Customers can update own reviews" ON public.reviews
  FOR UPDATE USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can delete own reviews" ON public.reviews;
CREATE POLICY "Customers can delete own reviews" ON public.reviews
  FOR DELETE USING (customer_id = auth.uid() OR public.is_admin());

-- Add review count and average rating columns to stores
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;

-- Function to update store rating statistics
CREATE OR REPLACE FUNCTION public.update_store_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _store_id UUID;
  _avg_rating NUMERIC(3,2);
  _review_count INTEGER;
BEGIN
  -- Determine which store to update
  IF (TG_OP = 'DELETE') THEN
    _store_id := OLD.store_id;
  ELSE
    _store_id := NEW.store_id;
  END IF;

  -- Calculate new statistics
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,2),
    COUNT(*)::INTEGER
  INTO _avg_rating, _review_count
  FROM public.reviews
  WHERE store_id = _store_id;

  -- Update store with new stats
  UPDATE public.stores
  SET 
    average_rating = _avg_rating,
    review_count = _review_count,
    rating = _avg_rating, -- Keep rating field in sync for backwards compatibility
    updated_at = now()
  WHERE id = _store_id;

  RETURN NULL;
END;
$$;

-- Trigger to update store ratings when reviews change
DROP TRIGGER IF EXISTS update_store_rating_on_review_change ON public.reviews;
CREATE TRIGGER update_store_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating_stats();

-- Update timestamp trigger for reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON public.reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Function to check if customer can review an order
CREATE OR REPLACE FUNCTION public.can_review_order(_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id
    AND o.customer_id = auth.uid()
    AND o.status = 'delivered'
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.order_id = _order_id
      AND r.customer_id = auth.uid()
    )
  )
$$;
