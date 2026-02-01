# Review System Implementation

## Overview
Implemented a complete real-time review system for stores with NEW badges for stores without reviews.

## Features Implemented

### 1. Database Schema (Migration: 20260201000000_add_reviews_system.sql)
- ✅ Created `reviews` table with:
  - Store ID reference
  - Customer ID reference
  - Order ID reference (optional)
  - Rating (1-5 stars)
  - Comment (optional text)
  - Timestamps
  - Unique constraint: one review per customer per order

- ✅ Added to `stores` table:
  - `review_count` (INTEGER): Total number of reviews
  - `average_rating` (NUMERIC): Calculated average rating

- ✅ Automatic rating calculation:
  - Trigger function `update_store_rating_stats()` automatically updates store statistics
  - Runs on INSERT, UPDATE, DELETE of reviews
  - Updates both `average_rating` and `review_count` fields
  - Keeps legacy `rating` field in sync for backwards compatibility

- ✅ Row Level Security (RLS) policies:
  - Anyone can view reviews
  - Customers can only review their delivered orders
  - Customers can update/delete their own reviews
  - One review per order per customer

### 2. Review Modal Component
**File:** `src/components/customer/ReviewModal.tsx`

- ✅ Interactive 5-star rating system
  - Hover effects with real-time preview
  - Rating labels: Poor, Fair, Good, Very Good, Excellent
  - Animated star interactions with Framer Motion

- ✅ Optional comment field (500 character limit)
- ✅ Validation: Rating required before submission
- ✅ Toast notifications for success/error
- ✅ Auto-refresh after review submission

### 3. UI Updates

#### Customer Home Page (`CustomerHome.tsx`)
- ✅ Shows actual average rating with review count
- ✅ Displays "NEW" badge (amber gradient) for stores with 0 reviews
- ✅ Format: "4.5" with "X reviews" below

#### Menu Page (`MenuPage.tsx`)
- ✅ Store selector shows real ratings or NEW badge
- ✅ Store header shows:
  - Rating with review count in parentheses
  - OR "NEW" badge if no reviews
- ✅ Real-time data from Supabase

#### Orders Page (`OrdersPage.tsx`)
- ✅ "Leave Review" button for delivered orders
- ✅ Button hidden if order already reviewed
- ✅ "Reviewed" badge shown for already-reviewed orders
- ✅ Opens review modal with store and order context
- ✅ Checks review status on page load

### 4. Type Definitions
**File:** `src/types/index.ts`

Added `Review` interface:
```typescript
interface Review {
  id: string;
  store_id: string;
  customer_id: string;
  order_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}
```

## How It Works

### Customer Flow:
1. Customer orders food from a store
2. Order is delivered (status = 'delivered')
3. On Orders page, "Leave Review" button appears
4. Customer clicks button → Review modal opens
5. Customer selects 1-5 stars and optionally adds comment
6. Submit → Review saved to database
7. Trigger automatically updates store's `average_rating` and `review_count`
8. All store displays immediately show updated rating
9. "Reviewed" badge replaces review button for that order

### Real-Time Rating Display:
- **NEW stores (0 reviews):** Shows amber "NEW" badge
- **Stores with reviews:** Shows star rating + review count
- **Format:** "4.5 ★ (12 reviews)"
- **Auto-updates:** Trigger keeps ratings current on every review change

## Database Functions

### `update_store_rating_stats()`
Automatically maintains accurate statistics:
1. Calculates average of all ratings for a store
2. Counts total reviews
3. Updates store record with new values
4. Triggered on any review INSERT/UPDATE/DELETE

### `can_review_order(_order_id)`
Security function to check if customer can review:
- Order must belong to customer (via auth.uid())
- Order status must be 'delivered'
- Customer hasn't already reviewed this order

## Next Steps (Optional Enhancements)

To deploy:
1. Run migration: `supabase db reset --linked` or push migration to production
2. Test review flow:
   - Place order
   - Mark as delivered (admin panel)
   - Leave review
   - Verify rating updates on store cards

Suggested future enhancements:
- Display recent reviews on store page
- Allow customers to edit their reviews
- Add photos to reviews
- Vendor response to reviews
- Helpful/unhelpful voting on reviews
- Filter stores by minimum rating
