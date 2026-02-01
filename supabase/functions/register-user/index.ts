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

// Input validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().max(50, 'Last name too long').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  role: z.enum(['customer', 'vendor', 'delivery_partner']),
  // Vendor specific
  businessName: z.string().min(1).max(100).optional(),
  licenseNumber: z.string().max(50).optional(),
  // Delivery partner specific
  vehicleType: z.string().max(30).optional(),
  vehicleNumber: z.string().max(20).optional(),
})

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Parse and validate input
    let body: z.infer<typeof RegisterSchema>
    try {
      const rawBody = await req.json()
      body = RegisterSchema.parse(rawBody)
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

    const { email, password, firstName, lastName, phone, role, businessName, licenseNumber, vehicleType, vehicleNumber } = body

    // SECURITY: Non-customer roles require admin authentication
    if (role !== 'customer') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Admin authentication required for non-customer registration' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create a client with the caller's auth
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      // Verify the caller is authenticated and is an admin
      const token = authHeader.replace('Bearer ', '')
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
      
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const adminUserId = claimsData.claims.sub as string

      // Check if the caller is an admin
      const { data: adminRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', adminUserId)
        .single()

      if (adminRole?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Only admins can register vendors or delivery partners' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validate role-specific requirements
    if (role === 'vendor' && !businessName) {
      return new Response(
        JSON.stringify({ error: 'Business name is required for vendor registration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user.id

    // Update profile with additional info
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName || null,
        phone: phone || null
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // Update user role (trigger creates 'customer' by default)
    if (role !== 'customer') {
      // Update the default role
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId)

      if (roleUpdateError) {
        console.error('Role update error:', roleUpdateError)
      }
    }

    // Create role-specific records (with is_verified=false by default)
    if (role === 'vendor') {
      const { error: vendorError } = await supabaseAdmin
        .from('vendors')
        .insert({
          id: userId,
          business_name: businessName,
          license_number: licenseNumber || null,
          is_verified: false // Require admin verification
        })

      if (vendorError) {
        console.error('Vendor creation error:', vendorError)
      }
    } else if (role === 'delivery_partner') {
      const { error: dpError } = await supabaseAdmin
        .from('delivery_partners')
        .insert({
          id: userId,
          vehicle_type: vehicleType || null,
          vehicle_number: vehicleNumber || null,
          is_verified: false // Require admin verification
        })

      if (dpError) {
        console.error('Delivery partner creation error:', dpError)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'User registered successfully',
        user: { id: userId, email, role }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
