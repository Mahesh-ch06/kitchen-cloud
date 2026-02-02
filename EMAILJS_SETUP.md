# EmailJS Setup Guide for CloudKitchen

## Overview
This guide will help you set up EmailJS to enable:
- Welcome emails when users sign up
- OTP-based login (password-less authentication)
- Order confirmation emails

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add Email Service

1. Go to "Email Services" in the dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Most common, easy setup
   - **Outlook**: Good alternative
   - **Custom SMTP**: For custom domains
4. Follow the authentication steps
5. Copy the **Service ID** (e.g., `service_abc123`)

## Step 3: Create Email Templates

### Template 1: Welcome Email

1. Go to "Email Templates" → "Create New Template"
2. Template Name: `Welcome to CloudKitchen`
3. Subject: `Welcome to CloudKitchen, {{to_name}}!`
4. Content:
```
Hi {{to_name}},

Welcome to {{app_name}}! 🎉

We're thrilled to have you join our food delivery community. Get ready to discover amazing cloud kitchens and delicious meals delivered right to your doorstep.

{{message}}

Happy ordering!
The CloudKitchen Team
```
5. Save and copy the **Template ID** (e.g., `template_welcome_xyz`)

### Template 2: OTP Login

1. Create another template
2. Template Name: `OTP Login Code`
3. Subject: `Your CloudKitchen Login Code: {{otp_code}}`
4. Content:
```
Your CloudKitchen verification code is:

{{otp_code}}

This code will expire in {{expiry_minutes}} minutes.

If you didn't request this code, please ignore this email.

Best regards,
{{app_name}} Security Team
```
5. Save and copy the **Template ID** (e.g., `template_otp_abc`)

### Template 3: Order Confirmation (Optional)

1. Create another template
2. Template Name: `Order Confirmation`
3. Subject: `Order Confirmed #{{order_id}}`
4. Content:
```
Hi {{to_name}},

Your order has been confirmed! 🎊

Order ID: {{order_id}}
Total Amount: {{order_total}}

Items:
{{order_items}}

Thank you for ordering with {{app_name}}!

Track your order in the app.
```
5. Save and copy the **Template ID**

## Step 4: Get Your Public Key

1. Go to "Account" → "API Keys"
2. Copy your **Public Key** (e.g., `xXaB1-cD2EfG3hI4jK`)

## Step 5: Configure Your App

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your EmailJS credentials:
```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_PUBLIC_KEY=xXaB1-cD2EfG3hI4jK
VITE_EMAILJS_TEMPLATE_WELCOME=template_welcome_xyz
VITE_EMAILJS_TEMPLATE_OTP=template_otp_abc
VITE_EMAILJS_TEMPLATE_ORDER=template_order_def
```

3. Restart your development server:
```bash
npm run dev
```

## Step 6: Test the Features

### Test Welcome Email
1. Go to `/signup`
2. Create a new account
3. Check your email inbox for the welcome message

### Test OTP Login
1. Go to `/login`
2. Click the "OTP" tab
3. Enter your email
4. Click "Send OTP"
5. Check your email for the 6-digit code
6. Enter the code and log in

## Troubleshooting

### Emails not sending?
- Check your EmailJS dashboard for error logs
- Verify your service is connected
- Make sure your email provider allows third-party apps
- For Gmail: Enable "Less secure app access" or use App Password

### OTP not working?
- OTP expires after 10 minutes
- Check browser console for errors
- Clear sessionStorage and try again

### Rate Limits
- Free EmailJS plan: 200 emails/month
- Upgrade to paid plan for more emails

## EmailJS Free Plan Limits
- ✅ 200 emails per month
- ✅ 2 email services
- ✅ Unlimited templates
- ✅ Basic support

For production, consider upgrading to a paid plan for higher limits.

## Security Notes
- Never commit your `.env` file to git
- The `.env.example` file is safe to commit (no real credentials)
- OTPs are stored in sessionStorage (not persisted)
- OTPs expire after 10 minutes

## Need Help?
- EmailJS Docs: https://www.emailjs.com/docs/
- Support: https://www.emailjs.com/support/
