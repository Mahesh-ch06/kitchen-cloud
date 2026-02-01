-- Create offers/coupons table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for code per store (allows same code in different stores)
CREATE UNIQUE INDEX idx_offers_store_code ON offers(store_id, code);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_offers_store_id ON offers(store_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can view own offers" ON offers;
DROP POLICY IF EXISTS "Vendors can create offers" ON offers;
DROP POLICY IF EXISTS "Vendors can update own offers" ON offers;
DROP POLICY IF EXISTS "Vendors can delete own offers" ON offers;
DROP POLICY IF EXISTS "Customers can view active offers" ON offers;
DROP POLICY IF EXISTS "Anyone can view active offers" ON offers;

-- Allow anyone to view active offers (for customers browsing)
CREATE POLICY "Anyone can view active offers"
  ON offers FOR SELECT
  USING (
    is_active = true 
    AND valid_until > NOW()
  );

-- Vendors can view ALL their own offers (including inactive)
CREATE POLICY "Vendors can view own offers"
  ON offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = offers.store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- Vendors can insert offers for their stores
CREATE POLICY "Vendors can create offers"
  ON offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- Vendors can update their own offers
CREATE POLICY "Vendors can update own offers"
  ON offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = offers.store_id 
      AND stores.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- Vendors can delete their own offers
CREATE POLICY "Vendors can delete own offers"
  ON offers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = offers.store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- Add offer tracking to orders (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'offer_code') THEN
    ALTER TABLE orders ADD COLUMN offer_code VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;
