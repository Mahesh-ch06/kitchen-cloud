-- Create saved addresses table for faster checkout
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL DEFAULT 'Home', -- Home, Work, Other
  address_type VARCHAR(20) NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  flat_no VARCHAR(100) NOT NULL,
  building_name VARCHAR(200),
  street VARCHAR(200),
  area VARCHAR(200) NOT NULL,
  landmark VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  pincode VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX idx_saved_addresses_is_default ON saved_addresses(is_default);

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_saved_addresses_updated_at ON saved_addresses;
CREATE TRIGGER update_saved_addresses_updated_at
  BEFORE UPDATE ON saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE saved_addresses 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default ON saved_addresses;
CREATE TRIGGER ensure_single_default
  BEFORE INSERT OR UPDATE ON saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- RLS Policies
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON saved_addresses;
CREATE POLICY "Users can view own addresses"
  ON saved_addresses FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own addresses
DROP POLICY IF EXISTS "Users can create addresses" ON saved_addresses;
CREATE POLICY "Users can create addresses"
  ON saved_addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own addresses
DROP POLICY IF EXISTS "Users can update own addresses" ON saved_addresses;
CREATE POLICY "Users can update own addresses"
  ON saved_addresses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own addresses
DROP POLICY IF EXISTS "Users can delete own addresses" ON saved_addresses;
CREATE POLICY "Users can delete own addresses"
  ON saved_addresses FOR DELETE
  USING (user_id = auth.uid());

-- Add delivery coordinates to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_latitude') THEN
    ALTER TABLE orders ADD COLUMN delivery_latitude DECIMAL(10, 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_longitude') THEN
    ALTER TABLE orders ADD COLUMN delivery_longitude DECIMAL(11, 8);
  END IF;
END $$;
