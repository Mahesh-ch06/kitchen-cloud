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
const UpdateOrderSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
  status: z.enum(['confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid status value' })
  })
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

    // Parse and validate input
    let body: z.infer<typeof UpdateOrderSchema>
    try {
      const rawBody = await req.json()
      body = UpdateOrderSchema.parse(rawBody)
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

    const { orderId, status } = body

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, store_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get store info
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('vendor_id, name')
      .eq('id', order.store_id)
      .single()

    if (!store) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is authorized (vendor who owns the store, or admin)
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    const isAdmin = userRole?.role === 'admin'
    const isVendor = store.vendor_id === userId

    if (!isAdmin && !isVendor) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to update this order' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification for customer
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: order.customer_id,
        title: 'Order Update',
        message: `Your order from ${store.name} is now ${status}`,
        type: 'order_update',
        data: { orderId, status }
      })

    // If order is confirmed, create delivery assignment and notify delivery partners
    if (status === 'confirmed') {
      // Create pending delivery assignment
      const { error: assignmentError } = await supabaseAdmin
        .from('delivery_assignments')
        .insert({
          order_id: orderId,
          status: 'pending'
        })

      if (!assignmentError) {
        // Get available delivery partners
        const { data: partners } = await supabaseAdmin
          .from('delivery_partners')
          .select('id')
          .eq('is_available', true)
          .eq('is_verified', true)

        // Notify all available delivery partners
        if (partners && partners.length > 0) {
          const notifications = partners.map(partner => ({
            user_id: partner.id,
            title: 'New Delivery Available',
            message: `New order ready for delivery from ${store.name}`,
            type: 'new_delivery',
            data: { orderId }
          }))

          await supabaseAdmin.from('notifications').insert(notifications)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Order status updated successfully',
        orderId,
        status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Update order error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
