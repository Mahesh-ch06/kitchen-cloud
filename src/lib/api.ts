import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://cvdwveeqfbcorublrsdr.supabase.co";

export interface RegisterUserParams {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'delivery_partner';
  // Vendor specific
  businessName?: string;
  licenseNumber?: string;
  // Delivery partner specific
  vehicleType?: string;
  vehicleNumber?: string;
}

export async function registerUser(params: RegisterUserParams) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/register-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHd2ZWVxZmJjb3J1Ymxyc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTEwNzAsImV4cCI6MjA4NTMyNzA3MH0.TilVBju3z2RF7dllINevm1n4gIcUOP61E_7_rzU_9bU',
    },
    body: JSON.stringify(params),
  });

  return response.json();
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/update-order-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHd2ZWVxZmJjb3J1Ymxyc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTEwNzAsImV4cCI6MjA4NTMyNzA3MH0.TilVBju3z2RF7dllINevm1n4gIcUOP61E_7_rzU_9bU',
    },
    body: JSON.stringify({ orderId, status }),
  });

  return response.json();
}

export async function acceptDelivery(orderId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/accept-delivery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHd2ZWVxZmJjb3J1Ymxyc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTEwNzAsImV4cCI6MjA4NTMyNzA3MH0.TilVBju3z2RF7dllINevm1n4gIcUOP61E_7_rzU_9bU',
    },
    body: JSON.stringify({ orderId }),
  });

  return response.json();
}

export async function processRefund(refundId: string, action: 'approve' | 'reject', reason?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/process-refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHd2ZWVxZmJjb3J1Ymxyc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTEwNzAsImV4cCI6MjA4NTMyNzA3MH0.TilVBju3z2RF7dllINevm1n4gIcUOP61E_7_rzU_9bU',
    },
    body: JSON.stringify({ refundId, action, reason }),
  });

  return response.json();
}

export async function getAdminStats() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZHd2ZWVxZmJjb3J1Ymxyc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTEwNzAsImV4cCI6MjA4NTMyNzA3MH0.TilVBju3z2RF7dllINevm1n4gIcUOP61E_7_rzU_9bU',
    },
  });

  return response.json();
}
