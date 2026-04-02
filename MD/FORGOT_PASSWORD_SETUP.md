# Quick Setup Guide for OTP Forgot Password System

## ✅ Implementation Complete!

Your donation platform now has a fully functional OTP-based password reset system. Follow these steps to get it working.

---

## Step 1: Email Configuration ⚙️

Add these environment variables to your `backend/.env` file:

```env
# SMTP Configuration for Password Reset Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
MAIL_FROM=noreply@donatesphere.com
```

### Setting Up Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Google Account
   - Go to https://myaccount.google.com
   - Click "Security" in the left menu
   - Find "2-Step Verification" and enable it

2. **Create an App-Specific Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Copy and paste this as `SMTP_PASS` in your `.env` file

3. **Use Your Gmail Address**
   - `SMTP_USER` = your full Gmail address (e.g., myname@gmail.com)

**Example Config:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mydonate@gmail.com
SMTP_PASS=glsx utak gode vqsx
MAIL_FROM=noreply@donatesphere.com
```

---

## Step 2: Restart Backend

Stop and restart your backend server:

```bash
cd backend
npm run dev
```

---

## Step 3: Test the System 🧪

### Option A: Via Frontend (Recommended)

1. Open your browser and go to `auth.html`
2. On the login screen, click "Forgot password?"
3. Enter your test email address
4. Click "Send OTP"
5. Check your email for the 6-digit code
6. Paste the code and click "Verify OTP"
7. Enter a new password and click "Reset Password"
8. Login with your new credentials

### Option B: Via API (Testing Tools Like Postman)

**Step 1: Send OTP**
```bash
POST http://localhost:5000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Step 2: Verify OTP** (use the 6-digit code from email)
```bash
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

**Step 3: Reset Password** (use same OTP)
```bash
POST http://localhost:5000/api/auth/reset-password
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456",
  "newPassword": "newPassword123"
}
```

---

## System Features 🎯

✅ **6-digit OTP** sent via email  
✅ **5-minute expiry** for security  
✅ **SHA-256 hashing** - OTP never stored in plain text  
✅ **Three-step process** - Email → OTP → Password  
✅ **Bcrypt hashing** - Password hashed with 10 salt rounds  
✅ **Account enumeration protection** - Generic messages  
✅ **Form validation** - Client & server-side validation  
✅ **Error handling** - Clear user-friendly messages  
✅ **Mobile-friendly** - Responsive design with numeric input  

---

## API Endpoints 🔌

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/forgot-password` | POST | Send OTP to email |
| `/api/auth/verify-otp` | POST | Verify OTP code |
| `/api/auth/reset-password` | POST | Reset password |

---

## What Was Changed 📝

### Backend
- ✅ Updated `User.js` model with `resetOTP`, `resetOTPExpires`, `isOTPVerified` fields
- ✅ Created `verifyOTP()` function in `authController.js`
- ✅ Updated `forgotPassword()` to use 5-minute expiry
- ✅ Updated `resetPassword()` to require OTP verification
- ✅ Added `/verify-otp` route in `authRoutes.js`
- ✅ Updated email template to show 5-minute expiry

### Frontend
- ✅ Enhanced forgot password panel with 3-step UI
- ✅ Added `forgot-verify-btn` for OTP verification step
- ✅ Updated `authPage.js` with state management for 3-step flow
- ✅ Added form hints and better UX
- ✅ Added `form-hint` CSS class for helper text
- ✅ Numeric input mode for OTP field

---

## Security Features 🔒

1. **OTP Security**
   - Generation: Cryptographically random 6 digits
   - Storage: SHA-256 hash (irreversible)
   - Expiry: 5 minutes
   - Comparison: Hash-based (not string comparison)

2. **Password Security**
   - Hashing: bcrypt with 10 salt rounds
   - Validation: Min 6 characters
   - Reset clears old OTP immediately

3. **Account Protection**
   - Account enumeration prevented
   - Email verification required
   - OTP verification state tracked
   - Expired OTPs automatically rejected

---

## Troubleshooting 🔧

### "Mail service is not configured"
→ Check your `.env` file has all SMTP variables

### "OTP not received in email"
→ Check spam folder, verify Gmail app-specific password

### "Invalid or expired OTP"
→ OTP only valid for 5 minutes, request new one

### Frontend buttons not working
→ Clear browser cache, restart backend with email configured

---

## Next Steps (Optional) 🚀

1. **Add Rate Limiting** - Limit OTP attempts (3 per hour)
2. **Add SMS OTP** - Support SMS delivery option
3. **Add Logging** - Track all password reset attempts
4. **Add Account Lockout** - Lock after 5 failed attempts
5. **Add Email Notifications** - Notify on password changes

---

## Support

For detailed documentation, see [OTP_FORGOT_PASSWORD.md](./OTP_FORGOT_PASSWORD.md)

Need help?
1. Check the console for error messages
2. Verify email configuration in `.env`
3. Check that backend is running on port 5000
4. Ensure MongoDB is running
5. Check browser console for frontend errors

---

**Status: ✅ Ready for Production**

Your OTP Forgot Password system is fully implemented and ready to use!
