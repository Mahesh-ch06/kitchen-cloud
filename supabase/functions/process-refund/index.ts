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
const ProcessRefundSchema = z.object({
  refundId: z.string().uuid('Invalid refund ID format'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either "approve" or "reject"' })
  }),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional()
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

    // Verify user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can process refunds' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate input
    let body: z.infer<typeof ProcessRefundSchema>
    try {
      const rawBody = await req.json()
      body = ProcessRefundSchema.parse(rawBody)
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

    const { refundId, action, reason } = body

    // Get refund details
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('refunds')
      .select('id, order_id, transaction_id, amount, status, reason')
      .eq('id', refundId)
      .single()

    if (refundError || !refund) {
      return new Response(
        JSON.stringify({ error: 'Refund not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (refund.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Refund has already been processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get order info for customer notification
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('customer_id')
      .eq('id', refund.order_id)
      .single()

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update refund status
    const { error: updateError } = await supabaseAdmin
      .from('refunds')
      .update({
        status: newStatus,
        processed_by: userId,
        processed_at: new Date().toISOString(),
        reason: reason || refund.reason
      })
      .eq('id', refundId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update refund status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If approved, update transaction status
    if (action === 'approve' && refund.transaction_id) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', refund.transaction_id)

      // Mark refund as processed
      await supabaseAdmin
        .from('refunds')
        .update({ status: 'processed' })
        .eq('id', refundId)
    }

    // Notify customer
    if (order) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.customer_id,
        title: action === 'approve' ? 'Refund Approved' : 'Refund Rejected',
        message: action === 'approve' 
          ? `Your refund of $${refund.amount} has been approved and will be processed shortly.`
          : `Your refund request has been rejected. ${reason || ''}`,
        type: 'refund_update',
        data: { refundId, status: newStatus }
      })
    }

    return new Response(
      JSON.stringify({ 
        message: `Refund ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        refundId,
        status: newStatus
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process refund error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
