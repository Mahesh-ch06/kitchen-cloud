import emailjs from '@emailjs/browser';

// EmailJS configuration
// To get these values, sign up at https://www.emailjs.com/
// 1. Create an account and verify your email
// 2. Add an email service (Gmail, Outlook, etc.)
// 3. Create email templates
// 4. Get your Public Key from Account > API Keys

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_xxxxxxx';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

// Template IDs
const TEMPLATE_IDS = {
  WELCOME: import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME || 'template_welcome',
  OTP: import.meta.env.VITE_EMAILJS_TEMPLATE_OTP || 'template_otp',
  ORDER_CONFIRMATION: import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER || 'template_order',
};

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      app_name: 'CloudKitchen',
      message: 'Welcome to CloudKitchen! We\'re excited to have you join our food delivery community.',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_IDS.WELCOME,
      templateParams
    );

    console.log('Welcome email sent successfully:', response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Generate and send OTP for login
 */
export async function sendOTPEmail(userEmail: string, otp: string, userName?: string) {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userName || 'Customer',
      otp_code: otp,
      app_name: 'CloudKitchen',
      expiry_minutes: '10',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_IDS.OTP,
      templateParams
    );

    console.log('OTP email sent successfully:', response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error };
  }
}

/**
 * Generate random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in session storage with expiry
 */
export function storeOTP(email: string, otp: string, expiryMinutes: number = 10) {
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
  const otpData = {
    otp,
    email,
    expiryTime,
  };
  sessionStorage.setItem('otp_data', JSON.stringify(otpData));
}

/**
 * Verify OTP
 */
export function verifyOTP(email: string, enteredOTP: string): boolean {
  try {
    const stored = sessionStorage.getItem('otp_data');
    if (!stored) return false;

    const otpData = JSON.parse(stored);
    
    // Check expiry
    if (Date.now() > otpData.expiryTime) {
      sessionStorage.removeItem('otp_data');
      return false;
    }

    // Check email and OTP match
    if (otpData.email === email && otpData.otp === enteredOTP) {
      sessionStorage.removeItem('otp_data');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  userEmail: string,
  userName: string,
  orderId: string,
  orderTotal: string,
  items: string
) {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      order_id: orderId,
      order_total: orderTotal,
      order_items: items,
      app_name: 'CloudKitchen',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATE_IDS.ORDER_CONFIRMATION,
      templateParams
    );

    console.log('Order confirmation email sent:', response.status);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    return { success: false, error };
  }
}
