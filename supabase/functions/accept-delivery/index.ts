import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  'https://id-preview--266c9cf6-68a8-472c-a3de-11520ceb228c.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Input validation schema
const AcceptDeliverySchema = z.object({
  orderId: z.string().uuid('Invalid order ID format')
})

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub as string

    // Verify user is a delivery partner
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (userRole?.role !== 'delivery_partner') {
      return new Response(
        JSON.stringify({ error: 'Only delivery partners can accept deliveries' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify delivery partner is available
    const { data: partner } = await supabaseAdmin
      .from('delivery_partners')
      .select('is_available, is_verified')
      .eq('id', userId)
      .single()

    if (!partner?.is_available || !partner?.is_verified) {
      return new Response(
        JSON.stringify({ error: 'Delivery partner is not available or not verified' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate input
    let body: z.infer<typeof AcceptDeliverySchema>
    try {
      const rawBody = await req.json()
      body = AcceptDeliverySchema.parse(rawBody)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: validationError.errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { orderId } = body

    // Check if assignment exists and is pending
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('delivery_assignments')
      .select('id, status')
      .eq('order_id', orderId)
      .single()

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Delivery assignment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (assignment.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Delivery already accepted by another partner' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Accept the delivery
    const { error: updateError } = await supabaseAdmin
      .from('delivery_assignments')
      .update({
        delivery_partner_id: userId,
        status: 'accepted',
        assigned_at: new Date().toISOString()
      })
      .eq('id', assignment.id)
      .eq('status', 'pending') // Double-check to prevent race conditions

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to accept delivery' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get order details for notifications
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('customer_id, store_id')
      .eq('id', orderId)
      .single()

    if (order) {
      // Get store info
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('vendor_id, name')
        .eq('id', order.store_id)
        .single()

      if (store) {
        // Notify customer
        await supabaseAdmin.from('notifications').insert({
          user_id: order.customer_id,
          title: 'Delivery Partner Assigned',
          message: `A delivery partner has been assigned to your order from ${store.name}`,
          type: 'delivery_assigned',
          data: { orderId }
        })

        // Notify vendor
        await supabaseAdmin.from('notifications').insert({
          user_id: store.vendor_id,
          title: 'Delivery Partner Assigned',
          message: `A delivery partner has accepted the delivery for order ${orderId.slice(0, 8)}`,
          type: 'delivery_assigned',
          data: { orderId }
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Delivery accepted successfully',
        orderId,
        assignmentId: assignment.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Accept delivery error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
