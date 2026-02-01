import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
        JSON.stringify({ error: 'Only admins can access stats' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get counts
    const [
      { count: totalUsers },
      { count: totalVendors },
      { count: totalStores },
      { count: totalOrders },
      { count: activeDeliveryPartners },
      { count: pendingRefunds }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('vendors').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('delivery_partners').select('*', { count: 'exact', head: true }).eq('is_available', true),
      supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    // Get order stats by status
    const { data: ordersByStatus } = await supabaseAdmin
      .from('orders')
      .select('status')

    const orderStats = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0
    }

    ordersByStatus?.forEach(order => {
      if (order.status in orderStats) {
        orderStats[order.status as keyof typeof orderStats]++
      }
    })

    // Get revenue (completed transactions)
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    // Get recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id, total_amount, status, created_at,
        stores(name),
        profiles!orders_customer_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    return new Response(
      JSON.stringify({
        stats: {
          totalUsers: totalUsers || 0,
          totalVendors: totalVendors || 0,
          totalStores: totalStores || 0,
          totalOrders: totalOrders || 0,
          activeDeliveryPartners: activeDeliveryPartners || 0,
          pendingRefunds: pendingRefunds || 0,
          totalRevenue
        },
        orderStats,
        recentOrders
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin stats error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
