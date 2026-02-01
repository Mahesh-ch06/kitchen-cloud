-- ================================================
-- REAL-TIME DELIVERY SYSTEM - Complete Setup
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Enable realtime for all relevant tables (skip if already added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE delivery_assignments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- Step 2: Create function to auto-create delivery_assignment when order is dispatched
CREATE OR REPLACE FUNCTION public.auto_create_delivery_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status changes to 'ready' or 'dispatched'
  -- and no delivery_assignment exists, create one
  IF (NEW.status IN ('ready', 'dispatched') AND 
      (OLD.status IS NULL OR OLD.status NOT IN ('ready', 'dispatched'))) THEN
    
    -- Check if assignment already exists
    IF NOT EXISTS (SELECT 1 FROM delivery_assignments WHERE order_id = NEW.id) THEN
      INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
      VALUES (NEW.id, 'pending', NULL);
      
      RAISE NOTICE 'Created delivery assignment for order %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger for orders table
DROP TRIGGER IF EXISTS on_order_ready_for_delivery ON orders;
CREATE TRIGGER on_order_ready_for_delivery
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_delivery_assignment();

-- Step 4: Create function to update order status when delivery is completed
CREATE OR REPLACE FUNCTION public.sync_order_delivery_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When delivery is marked as delivered, update order status too
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE orders 
    SET status = 'delivered'
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger for delivery status sync
DROP TRIGGER IF EXISTS on_delivery_completed ON delivery_assignments;
CREATE TRIGGER on_delivery_completed
  AFTER UPDATE OF status ON delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_delivery_status();

-- Step 6: Create missing assignments for existing orders
INSERT INTO delivery_assignments (order_id, status, delivery_partner_id)
SELECT o.id, 'pending', NULL
FROM orders o
WHERE o.status IN ('ready', 'dispatched')
  AND NOT EXISTS (
    SELECT 1 FROM delivery_assignments da WHERE da.order_id = o.id
  )
ON CONFLICT (order_id) DO NOTHING;

-- Step 7: Verify realtime is enabled
SELECT 'Realtime Tables:' as info, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Step 8: Show current pending assignments ready for pickup
SELECT 
  'Available for Delivery Partners' as info,
  da.id as assignment_id,
  da.order_id,
  da.status as delivery_status,
  o.status as order_status,
  o.total_amount,
  LEFT(o.delivery_address, 50) as address,
  s.name as store
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
JOIN stores s ON o.store_id = s.id
WHERE da.status = 'pending'
  AND da.delivery_partner_id IS NULL
  AND o.status IN ('ready', 'dispatched')
ORDER BY da.created_at;
