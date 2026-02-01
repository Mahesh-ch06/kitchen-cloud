-- Fix RLS policies for offers table
-- Drop and recreate all policies to ensure proper access

-- Drop all existing policies
DROP POLICY IF EXISTS "Vendors can view own offers" ON offers;
DROP POLICY IF EXISTS "Vendors can create offers" ON offers;
DROP POLICY IF EXISTS "Vendors can update own offers" ON offers;
DROP POLICY IF EXISTS "Vendors can delete own offers" ON offers;
DROP POLICY IF EXISTS "Customers can view active offers" ON offers;
DROP POLICY IF EXISTS "Anyone can view active offers" ON offers;
DROP POLICY IF EXISTS "Public can view active offers" ON offers;
DROP POLICY IF EXISTS "Allow authenticated users to manage offers" ON offers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON offers;

-- Ensure RLS is enabled
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- 1. Allow anyone (including anonymous) to view active offers
CREATE POLICY "Public can view active offers"
  ON offers FOR SELECT
  USING (
    is_active = true 
    AND valid_until > NOW()
  );

-- 2. Vendors can view ALL their own offers (including inactive ones)
CREATE POLICY "Vendors can view own offers"
  ON offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = offers.store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- 3. Vendors can INSERT offers for their own stores
-- Using EXISTS for better performance and clarity
CREATE POLICY "Vendors can create offers"
  ON offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- 4. Vendors can UPDATE their own offers
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

-- 5. Vendors can DELETE their own offers
CREATE POLICY "Vendors can delete own offers"
  ON offers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = offers.store_id 
      AND stores.vendor_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT ON offers TO anon;
GRANT SELECT ON offers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON offers TO authenticated;
