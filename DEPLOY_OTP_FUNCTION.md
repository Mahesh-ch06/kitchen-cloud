# Deploy OTP Verification Edge Function

## Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI**:
```powershell
npm install -g supabase
```

2. **Login to Supabase**:
```powershell
supabase login
```

3. **Link your project**:
```powershell
supabase link --project-ref cvdwveeqfbcorublrsdr
```

4. **Deploy the function**:
```powershell
supabase functions deploy verify-otp-login
```

## Option 2: Manual Deployment via Dashboard

1. Go to: https://app.supabase.com/project/cvdwveeqfbcorublrsdr/functions

2. Click "Create a new function"

3. Name it: `verify-otp-login`

4. Copy the contents from: `supabase/functions/verify-otp-login/index.ts`

5. Paste into the editor

6. Click "Deploy"

## How OTP Login Works Now

1. **User enters email** → Click "Send OTP"
2. **EmailJS sends 6-digit code** to their email (using your template_o8loxlj)
3. **User enters OTP** → Click "Verify"
4. **System verifies OTP** from sessionStorage
5. **Edge Function authenticates** user with Supabase
6. **User is logged in** with full profile access

## Testing

After deploying, test the OTP login:
1. Go to `/login` → OTP tab
2. Enter your email
3. Check email for 6-digit code
4. Enter code and verify
5. Should redirect to /menu with full profile loaded
