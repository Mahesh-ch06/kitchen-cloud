# Offers/Coupons System Setup Guide

## Overview
A complete offers and coupons system has been implemented with:
- **Vendor Interface**: Create, edit, and manage promotional offers
- **Customer Interface**: View and apply offers to orders
- **Database Schema**: Full support for offer tracking and order discounts

## Features Implemented

### 1. Database Schema (`20260201120000_add_offers_system.sql`)
- **Offers Table**: Stores all promotional offers with:
  - Unique coupon codes
  - Discount types (percentage/fixed)
  - Minimum order amounts
  - Maximum discount caps
  - Usage limits and tracking
  - Validity periods
  - Active/inactive status

- **Orders Table Updates**: Added columns for:
  - `offer_code`: Tracks which offer was used
  - `discount_amount`: Stores the discount applied

- **Row Level Security**: 
  - Vendors can CRUD offers for their own stores
  - Customers can view active, valid offers

### 2. Vendor Interface (`OffersTab.tsx`)
**Location**: Vendor Dashboard → Offers Tab

**Features**:
- Create new offers with full customization
- Edit existing offers
- Toggle active/inactive status
- Delete offers (with confirmation)
- View usage statistics
- See expiry dates and remaining uses
- Real-time validation

**Access**: Navigate to vendor dashboard, click "Offers" in the sidebar

### 3. Customer Interface (`ViewOffersModal.tsx`)
**Location**: Cart Page → "VIEW OFFERS" button

**Features**:
- Browse all active offers for the store
- Manual coupon code entry
- Automatic discount calculation
- Validation (min order, usage limits, expiry)
- Apply/remove offers
- See savings in real-time
- Visual feedback on applied offers

**Access**: Cart page → Click "VIEW OFFERS" or "Apply Coupon"

## Setup Instructions

### Step 1: Apply Database Migration

**Option A - Using Supabase Cloud Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `supabase/migrations/20260201120000_add_offers_system.sql`
5. Paste and run the migration
6. Verify the `offers` table was created in **Table Editor**

**Option B - Using Supabase CLI (if local DB is running):**
```bash
npx supabase migration up
```

**Option C - Manual table creation via dashboard:**
1. Go to **Table Editor**
2. Create new table: `offers`
3. Add all columns as specified in the migration file
4. Set up RLS policies manually

### Step 2: Verify TypeScript Types
The Supabase types have been updated in `src/integrations/supabase/types.ts` to include the offers table. No action needed.

### Step 3: Test the System

**As a Vendor:**
1. Login as a vendor
2. Navigate to vendor dashboard
3. Click "Offers" tab in sidebar
4. Click "Create New Offer"
5. Fill in offer details:
   - Code: `SAVE20` (unique)
   - Description: `Get 20% off on orders above ₹200`
   - Discount Type: Percentage
   - Discount Value: 20
   - Min Order Amount: 200
   - Max Discount: 100
   - Usage Limit: 50
   - Valid dates
6. Click "Create Offer"
7. Verify offer appears in the list

**As a Customer:**
1. Login as a customer
2. Add items to cart (ensure total > ₹200 for the test offer)
3. Go to cart page
4. Click "VIEW OFFERS" button
5. See the offer in the modal
6. Click "Apply" on the offer
7. Verify discount is applied to bill
8. Verify "TO PAY" amount is reduced
9. Proceed to checkout (offer persists)

### Step 4: Production Checklist
- [ ] Migration applied to production database
- [ ] Test offer creation as vendor
- [ ] Test offer application as customer
- [ ] Verify RLS policies work (vendors can't see other vendors' offers)
- [ ] Test expired offers don't show for customers
- [ ] Test usage limit enforcement
- [ ] Test minimum order amount validation

## Code Changes Summary

### Files Created:
1. `supabase/migrations/20260201120000_add_offers_system.sql` - Database schema
2. `src/components/vendor/OffersTab.tsx` - Vendor offer management
3. `src/components/customer/ViewOffersModal.tsx` - Customer offer viewing

### Files Modified:
1. `src/integrations/supabase/types.ts` - Added offers table types
2. `src/pages/vendor/VendorHome.tsx` - Added Offers tab to navigation
3. `src/pages/customer/CartPage.tsx` - Integrated offers modal and discount calculation

## Database Schema Details

### Offers Table Structure:
```sql
offers (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### RLS Policies:
- **Vendors**: Can INSERT, UPDATE, DELETE offers for their own stores
- **Customers**: Can SELECT active offers where `is_active = true` and `valid_until > NOW()`

## Troubleshooting

### Issue: "VIEW OFFERS" button not responding
**Solution**: Ensure the migration has been applied and the offers table exists in your database.

### Issue: No offers showing in modal
**Solution**: 
- Verify vendor has created offers for the specific store
- Check offers are marked as `is_active = true`
- Verify `valid_until` date is in the future
- Check browser console for API errors

### Issue: Cannot create offers as vendor
**Solution**:
- Verify you're logged in as a vendor
- Ensure you have at least one store created
- Check RLS policies are properly set up

### Issue: Discount not applying correctly
**Solution**:
- Check minimum order amount is met
- Verify offer hasn't reached usage limit
- Ensure discount calculation logic in `ViewOffersModal.tsx` is correct

## Future Enhancements

Potential additions:
- [ ] Offer analytics (views, applications, conversions)
- [ ] Automatic offer recommendations based on cart value
- [ ] First-time user offers
- [ ] Seasonal/holiday offer templates
- [ ] Offer categories (delivery, item-specific, bundle)
- [ ] Referral code system
- [ ] Loyalty program integration
- [ ] Bulk offer creation
- [ ] A/B testing for offers

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migration status
3. Test with simple offer first (no min order, high usage limit)
4. Check Supabase logs for API errors
