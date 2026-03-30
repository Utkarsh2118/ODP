# OTP-Based Forgot Password System Documentation

## Overview
This document describes the implementation of a secure OTP (One-Time Password) based password reset system for the DonateSphere donation platform. The system uses 6-digit OTPs sent via email to securely reset user passwords.

## Features
- ✅ 6-digit OTP generation using cryptographically secure random numbers
- ✅ OTP expires in 5 minutes for security
- ✅ OTP stored as SHA-256 hash in MongoDB (never stored in plain text)
- ✅ Email verification using NodeMailer with HTML/plain text templates
- ✅ Three-step password reset flow (Email → OTP Verification → Password Reset)
- ✅ Bcrypt password hashing with 10 salt rounds
- ✅ Account enumeration protection (generic response for non-existent emails)
- ✅ OTP verification state tracking
- ✅ Proper form validation and error handling
- ✅ User-friendly UI with step indicators

## System Architecture

### Backend API Endpoints

#### 1. POST `/api/auth/forgot-password`
Initiates the password reset process by sending an OTP to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "If an account exists with that email, an OTP has been sent."
}
```

**Response (Mail Service Error):**
```json
{
  "success": false,
  "message": "Mail service is not configured on server"
}
```

**Security Notes:**
- Always returns a generic response (even if email doesn't exist) to prevent account enumeration
- OTP generated: 6-digit random number (100000-999999)
- OTP stored: SHA-256 hash in database
- OTP validity: 5 minutes from generation time
- Email verification required for the next step

---

#### 2. POST `/api/auth/verify-otp`
Verifies the OTP provided by the user before allowing password reset.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password."
}
```

**Response (Invalid/Expired OTP):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**Security Notes:**
- Validates that OTP matches the hashed stored OTP
- Checks OTP hasn't expired (5-minute window)
- Sets `isOTPVerified` flag to true for this email
- Email + OTP combination must be valid

---

#### 3. POST `/api/auth/reset-password`
Resets the user's password after successful OTP verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**Response (Invalid/Unverified OTP):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP. Please request a new one."
}
```

**Security Notes:**
- Requires valid OTP that matches the email
- Requires OTP to be verified first (isOTPVerified = true)
- New password is hashed with bcrypt (10 salt rounds)
- Previous OTP is cleared after successful reset
- OTP verification flag is reset

---

## Database Schema Updates

### User Model Additions

```javascript
resetOTP: {
  type: String,  // Hashed OTP (SHA-256)
  default: null,
},
resetOTPExpires: {
  type: Date,    // OTP expiration timestamp
  default: null,
},
isOTPVerified: {
  type: Boolean, // Flag indicating OTP verification
  default: false,
},
```

These fields are:
- **resetOTP**: Stores the SHA-256 hash of the generated OTP
- **resetOTPExpires**: Unix timestamp of OTP expiration (5 minutes from generation)
- **isOTPVerified**: Tracks whether the user has successfully verified their OTP

---

## Frontend Implementation

### HTML Structure
The forgot password panel includes three steps:

**Step 1: Email Input**
- Email verification form
- "Send OTP" button
- Email field enabled, OTP field disabled until OTP is sent

**Step 2: OTP Verification**
- 6-digit OTP input field
- "Verify OTP" button
- Hint showing to check email for code
- Numeric input mode for better UX on mobile
- Email field disabled, OTP field enabled

**Step 3: Password Reset**
- New password input field
- Password visibility toggle
- "Reset Password" button
- Hint showing minimum password length

### JavaScript Flow

The frontend manages password reset state with:

```javascript
let forgotPasswordState = {
  step: 1,        // Current step (1, 2, or 3)
  email: "",      // User's email
  otpVerified: false, // OTP verification status
};
```

**Flow Handlers:**

1. **Send OTP Handler** (`forgot-generate-btn`)
   - Validates email format
   - Calls POST `/api/auth/forgot-password`
   - Disables email field
   - Enables OTP field
   - Sets step = 2

2. **Verify OTP Handler** (`forgot-verify-btn`)
   - Validates OTP format (6 digits)
   - Calls POST `/api/auth/verify-otp`
   - Sets `otpVerified = true`
   - Disables OTP field
   - Enables password field
   - Sets step = 3

3. **Reset Password Handler** (`forgot-reset-btn`)
   - Validates new password
   - Calls POST `/api/auth/reset-password`
   - Clears all form fields
   - Closes forgot password panel
   - Resets state
   - Shows success message

---

## Configuration

### Email Setup (Required)
Update your `.env` file in the backend folder:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@donatesphere.com
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the generated password as `SMTP_PASS`

**For Other Providers:**
- Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587` (TLS) or `465` (SSL)
- SendGrid: Contact their documentation
- Mailgun: Contact their documentation

### OTP Settings
Current settings (hardcoded, can be made configurable):
- **OTP Length**: 6 digits
- **OTP Validity**: 5 minutes (300,000 milliseconds)
- **Hash Algorithm**: SHA-256
- **Password Hashing**: bcrypt with 10 salt rounds

---

## Security Best Practices

### ✅ Implemented Security Features

1. **OTP Security**
   - 6-digit OTP provides ~1 million combinations
   - OTP expires after 5 minutes
   - OTP hashed before storage (SHA-256)
   - OTP never stored in plain text

2. **Password Security**
   - Passwords hashed with bcrypt (10 salt rounds)
   - New passwords validated for minimum 6 characters
   - Password reset clears old OTP immediately

3. **Account Protection**
   - Account enumeration prevented (same response for valid/invalid emails)
   - OTP must be verified before password reset
   - Email verification required before password change
   - Multiple invalid OTP attempts don't cause account lockout (can be added if needed)

4. **Database Security**
   - OTP stored as hash (not reversible)
   - OTP validity timestamp prevents replay
   - User password field excluded from profile responses

5. **Application Security**
   - Input validation on all endpoints
   - Express-validator for request validation
   - Async/await error handling with try-catch
   - Proper HTTP status codes returned

### Recommended Enhancements

1. **Rate Limiting** (Recommended)
   - Limit OTP generation to 3 attempts per email per hour
   - Limit OTP verification attempts to 5 per OTP

2. **Account Lockout** (Optional)
   - Lock account after 5 failed OTP attempts
   - Unlock after 15 minutes or manual admin unlock

3. **Logging** (Recommended)
   - Log all password reset attempts
   - Monitor for suspicious patterns
   - Alert on multiple failed attempts

4. **Session Management** (Optional)
   - Create temporary session after OTP verification
   - Session expires after 30 minutes
   - Session required before password reset

---

## Error Handling

### Common Error Scenarios

| Scenario | Backend Response | Frontend Action |
|----------|------------------|-----------------|
| Email not found | Returns generic message | Shows generic message |
| OTP not sent (mail error) | Returns 500 error | Shows error message |
| Invalid email format | Returns validation error | Shows input validation error |
| OTP expired (> 5 min) | Returns 400 error | Shows error, ask for new OTP |
| Wrong OTP | Returns 400 error | Shows error, can retry |
| Password too short | Returns validation error | Shows validation error |
| OTP not verified | Returns 400 error | Shows error, ask to verify OTP |

### Frontend Error Messages
- **Email validation**: "Valid email is required"
- **OTP validation**: "OTP must be 6 digits"
- **Password validation**: "Password must be at least 6 characters"
- **OTP expired**: "Invalid or expired OTP. Please request a new one."
- **OTP not verified**: "Please verify your OTP first"

---

## Testing the System

### Prerequisites
1. Backend running on `http://localhost:5000`
2. Email configuration in `.env` is set up
3. Frontend serving on `http://localhost:3000` (or directly open `auth.html`)

### Manual Testing Steps

1. **Test OTP Sending**
   - Click "Forgot password?" on login screen
   - Enter valid email address
   - Click "Send OTP"
   - Expected: Get email with 6-digit code
   - Check console for any errors

2. **Test OTP Verification**
   - Copy the OTP from email
   - Paste into OTP field
   - Click "Verify OTP"
   - Expected: Password field enables
   - Check for success message

3. **Test Password Reset**
   - Enter new password (min 6 chars)
   - Click "Reset Password"
   - Expected: Success message and form clears
   - Login with new credentials

4. **Test Error Cases**
   - Test with invalid OTP
   - Test with expired OTP (> 5 minutes)
   - Test with invalid email format
   - Test with password < 6 characters

### API Testing (Using Postman/cURL)

**Test OTP Sending:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Test OTP Verification:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

**Test Password Reset:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"newPassword123"}'
```

---

## Troubleshooting

### Issue: "Mail service is not configured on server"
**Solution**: Check your `.env` file has all required email variables:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- MAIL_FROM

### Issue: OTP Not Received in Email
**Solution**: 
- Check spam folder
- Verify SMTP credentials are correct
- Check application logs for email errors
- Verify sender email address (MAIL_FROM)

### Issue: "Invalid or expired OTP"
**Solution**:
- OTP might have expired (5-minute window)
- Request a new OTP
- Ensure you're using the correct email that received the OTP
- Check system time is synchronized

### Issue: Frontend Buttons Not Working
**Solution**:
- Clear browser cache
- Check browser console for errors
- Verify API endpoint URLs in config.js
- Ensure backend is running

### Issue: OTP Keeps Failing Even With Correct Code
**Solution**:
- Verify OTP field is accepting 6 digits
- Check for extra spaces or formatting
- Request a new OTP and try again
- Check MongoDB connection is working

---

## API Response Examples

### Successful OTP Sending
```json
{
  "success": true,
  "message": "If an account exists with that email, an OTP has been sent."
}
```

### Successful OTP Verification
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password."
}
```

### Successful Password Reset
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   └── User.js (Updated: added resetOTP, resetOTPExpires, isOTPVerified)
│   ├── controllers/
│   │   └── authController.js (Updated: added verifyOTP function)
│   ├── routes/
│   │   └── authRoutes.js (Updated: added verify-otp endpoint)
│   └── config/
│       └── mailer.js (Updated: OTP expires in 5 minutes message)

frontend/
├── auth.html (Updated: three-step forgot password panel)
├── assets/
│   ├── css/
│   │   └── styles.css (Updated: added form-hint style)
│   └── js/
│       └── authPage.js (Updated: three-step OTP flow logic)
```

---

## Future Enhancements

1. **SMS-based OTP** - Support OTP delivery via SMS
2. **Rate Limiting** - Implement rate limiting for security
3. **Account Lockout** - Lock accounts after failed attempts
4. **Email Templates** - Use more sophisticated email templates
5. **OTP Regeneration** - Allow users to request new OTP
6. **Two-Factor Auth** - Extend to 2FA implementation
7. **Password History** - Prevent reusing old passwords
8. **Email Notifications** - Notify user of password changes

---

## License & Support

For issues or questions, check the console logs and ensure all environment variables are properly configured.

Last Updated: March 30, 2026
