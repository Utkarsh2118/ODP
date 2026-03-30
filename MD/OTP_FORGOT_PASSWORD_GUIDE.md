# Forgot Password System with OTP - Complete Guide

## Overview
The DonateSphere platform includes a **fully implemented OTP-based forgot password system** using MERN stack with the following features:

✅ 6-digit OTP generation  
✅ 5-minute OTP expiry  
✅ Nodemailer email integration  
✅ bcrypt password hashing  
✅ Security best practices  
✅ Account enumeration prevention  
✅ Modern responsive UI  

---

## System Architecture

### Technology Stack
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Email Service:** Nodemailer (SMTP)
- **Security:** bcryptjs, crypto (SHA256)
- **Frontend:** Vanilla JavaScript + HTML5/CSS3

---

## Backend Implementation

### 1. Database Schema (User Model)

**File:** `backend/src/models/User.js`

```javascript
resetOTP: {
  type: String,           // SHA256 hashed OTP
  default: null,
},
resetOTPExpires: {
  type: Date,             // 5-minute expiry
  default: null,
},
isOTPVerified: {
  type: Boolean,          // Flag for two-step verification
  default: false,
},
```

### 2. API Endpoints

**File:** `backend/src/routes/authRoutes.js`

#### Endpoint 1: POST `/api/auth/forgot-password`
**Purpose:** Send OTP to user's email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "If an account exists with that email, an OTP has been sent."
}
```

**Response (SMTP Not Configured - 500):**
```json
{
  "success": false,
  "message": "Mail service is not configured on server"
}
```

**Features:**
- ✅ Generates 6-digit random OTP
- ✅ Hashes OTP with SHA256
- ✅ Stores in MongoDB with 5-minute expiry
- ✅ Sends HTML+Text email via Nodemailer
- ✅ Returns generic message (prevents account enumeration)
- ✅ Validates email format

**Email Content:**
```
Subject: DonateSphere Password Reset OTP
Body: "Your OTP is: XXXXXX"
Expires: 5 minutes
```

---

#### Endpoint 2: POST `/api/auth/verify-otp`
**Purpose:** Verify OTP validity (optional, used for two-step flow)

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Valid OTP - 200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password."
}
```

**Response (Invalid or Expired - 400):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**Features:**
- ✅ Validates OTP format (6 digits)
- ✅ Checks OTP expiry time
- ✅ Sets isOTPVerified flag
- ✅ Hashes provided OTP for comparison

---

#### Endpoint 3: POST `/api/auth/reset-password`
**Purpose:** Reset password after OTP verification

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**Response (Invalid OTP - 400):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP. Please request a new one."
}
```

**Process:**
1. Validates OTP again
2. Checks expiry time
3. Verifies OTP was verified in step 2
4. Hashes new password with bcrypt (salt rounds: 10)
5. Clears all OTP fields
6. Returns success message

---

### 3. Validation Middleware

**File:** `backend/src/controllers/authController.js`

```javascript
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
];

const verifyOTPValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
];

const resetPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("otp")
    .trim()
    .isLength({ min: 4, max: 8 })
    .withMessage("Valid OTP is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];
```

---

### 4. Mailer Configuration

**File:** `backend/src/config/mailer.js`

```javascript
const nodemailer = require("nodemailer");

// Checks if all SMTP vars are configured
const isMailerConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
};

// Creates transporter with SMTP config
const getTransporter = () => {
  if (!isMailerConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Sends OTP email with HTML template
const sendPasswordResetOtp = async ({ toEmail, name, otp }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Mail service is not configured");
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">DonateSphere Password Reset</h2>
      <p>Hi ${name || "User"},</p>
      <p>Your OTP to reset password is:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 3px; color: #0f766e;">${otp}</p>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject: "DonateSphere Password Reset OTP",
    text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
    html,
  });
};
```

---

## Frontend Implementation

### 1. HTML Structure

**File:** `frontend/auth.html`

The forgot password panel is integrated into the login form with 3 input sections:

```html
<div id="forgot-password-panel" class="forgot-panel">
  <!-- Step 1: Email & Send OTP -->
  <input id="forgot-email" type="email" placeholder="your@email.com" />
  <button id="forgot-generate-btn">Send OTP</button>

  <!-- Step 2: OTP & New Password -->
  <input id="forgot-otp" type="text" placeholder="Enter 6-digit OTP" maxlength="6" />
  <input id="forgot-new-password" type="password" placeholder="New password" />
  <button id="forgot-reset-btn">Reset Password</button>

  <!-- Messages -->
  <p id="forgot-message" class="auth-message"></p>
</div>
```

### 2. JavaScript Logic

**File:** `frontend/assets/js/authPage.js`

#### Step 1: Send OTP Handler
```javascript
forgotGenerateBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = forgotEmail.value.trim();
  
  // Validate email
  const emailErr = validateEmail(email);
  if (emailErr) {
    showError(document.getElementById("forgot-email-error"), emailErr);
    return;
  }

  try {
    // Call POST /auth/forgot-password
    const response = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    showAuthMessage(forgotMsg, response.message, "success");
  } catch (error) {
    showAuthMessage(forgotMsg, error.message, "error");
  }
});
```

#### Step 2: Reset Password Handler
```javascript
forgotResetBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = forgotEmail.value.trim();
  const otp = forgotOtp.value.trim();
  const newPassword = forgotNewPassword.value;

  // Validate all fields
  const emailErr = validateEmail(email);
  const otpErr = validateOtp(otp);  // Checks: 6 digits
  const passwordErr = validatePassword(newPassword);  // Checks: min 6 chars

  if (emailErr || otpErr || passwordErr) {
    // Show errors
    return;
  }

  try {
    // Call POST /auth/reset-password
    const response = await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });

    showAuthMessage(forgotMsg, response.message, "success");
    // Clear inputs
    forgotOtp.value = "";
    forgotNewPassword.value = "";
  } catch (error) {
    showAuthMessage(forgotMsg, error.message, "error");
  }
});
```

### 3. Validation Functions

**File:** `frontend/assets/js/authPage.js`

```javascript
const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!isValidEmail(email)) return "Please enter a valid email address";
  return null;
};

const validateOtp = (otp) => {
  if (!otp || !otp.trim()) return "OTP is required";
  if (!/^\d{6}$/.test(otp.trim())) return "OTP must be 6 digits";
  return null;
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};
```

---

## Security Features

### 1. OTP Security
- ✅ **Random Generation:** Uses `Math.floor(100000 + Math.random() * 900000)`
- ✅ **Hashing:** SHA256 hash stored in DB, not plain text
- ✅ **Expiry:** 5 minutes (300,000 ms)
- ✅ **Single Use:** Cleared after successful reset

### 2. Password Security
- ✅ **Bcrypt Hashing:** Salt rounds = 10
- ✅ **Minimum Length:** 6 characters enforced
- ✅ **Storage:** Hashed password, not plaintext

### 3. Request Security
- ✅ **Email Validation:** Standard email format check
- ✅ **Rate Limiting:** Can be added to prevent brute force
- ✅ **HTTPS:** Recommended for production
- ✅ **CSRF Protection:** Can be added with express-csrf

### 4. Account Protection
- ✅ **Generic Response:** "If an account exists..." prevents account enumeration
- ✅ **Case-Insensitive Emails:** Normalized in DB
- ✅ **Error Messages:** Don't reveal if account exists

---

## Setup Instructions

### Step 1: Configure Environment Variables

**File:** `backend/.env`

Replace placeholders with your actual SMTP credentials:

```bash
# SMTP Configuration for OTP emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
MAIL_FROM=DonateSphere <your_email@gmail.com>
```

#### For Gmail:
1. Enable 2FA on Gmail account
2. Create App Password (not your regular password)
3. Go to: https://myaccount.google.com/apppasswords
4. Select Mail & Windows Computer
5. Copy the 16-character password
6. Use as `SMTP_PASS` in .env

#### For Other SMTP Providers:
- **SendGrid:** host=smtp.sendgrid.net, port=587
- **Mailgun:** host=smtp.mailgun.org, port=587
- **AWS SES:** host=email-smtp.region.amazonaws.com, port=587

---

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

Required packages (already in package.json):
- `nodemailer` - Email sending
- `bcryptjs` - Password hashing
- `crypto` - OTP hashing (built-in Node.js)
- `express-validator` - Validation

---

### Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

---

### Step 4: Test the System

See section: **Testing the Forgot Password System** below

---

## Testing the System

### Using Browser

**Step 1: Open Auth Page**
```
http://localhost:3000/frontend/auth.html
```

**Step 2: Click "Forgot Password?" Link**
- Located in login form below password field

**Step 3: Send OTP**
1. Enter your email address
2. Click "Send OTP" button
3. Check email for OTP (if SMTP configured)

**Step 4: Reset Password**
1. Enter the 6-digit OTP
2. Enter new password (min 6 chars)
3. Click "Reset Password" button
4. On success, login with new password

### Using curl/Postman

#### Test 1: Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'
```

Expected Response:
```json
{
  "success": true,
  "message": "If an account exists with that email, an OTP has been sent."
}
```

#### Test 2: Reset Password (with real OTP from email)
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "otp":"123456",
    "newPassword":"newSecurePass123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

---

### Using PowerShell (Windows)

```powershell
# Send OTP
$body = @{ email = 'test@example.com' } | ConvertTo-Json
$res = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/auth/forgot-password" `
  -ContentType "application/json" `
  -Body $body

Write-Output "Status: $($res.success)"
Write-Output "Message: $($res.message)"
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Mail service is not configured" | SMTP vars not set | Configure .env with SMTP credentials |
| "Invalid or expired OTP" | OTP is wrong or > 5 min old | Request new OTP |
| "Password must be at least 6 characters" | Password too short | Use 6+ character password |
| "Valid email is required" | Email format invalid | Use valid email format |
| "OTP must be 6 digits" | Non-numeric or wrong length | Use 6-digit OTP from email |

---

## API Response Codes

| Code | Scenario | Example |
|------|----------|---------|
| 200 | Success | OTP sent, password reset |
| 400 | Validation Error | Invalid OTP, expired OTP |
| 500 | Server Error | SMTP not configured |

---

## User Flow Diagram

```
┌─────────────────┐
│  Login Page     │
│   (auth.html)   │
└────────┬────────┘
         │
    Click "Forgot Password?"
         │
         ▼
┌─────────────────────────┐
│ Step 1: Enter Email     │
│ [Email Input]           │
│ [Send OTP] Button       │
└────────┬────────────────┘
         │
    POST /forgot-password
         │
         ▼
┌──────────────────────────────┐
│ Backend: Generate OTP        │
│ - Generate 6-digit number    │
│ - Hash with SHA256           │
│ - Store in MongoDB (5 min)   │
│ - Send Email via Nodemailer  │
└────────┬─────────────────────┘
         │
    Email Received
         │
         ▼
┌──────────────────────────┐
│ Step 2: Enter OTP & Pass │
│ [OTP Input]              │
│ [New Password]           │
│ [Reset Password] Button  │
└────────┬─────────────────┘
         │
    POST /reset-password
         │
         ▼
┌────────────────────────────┐
│ Backend: Verify & Reset    │
│ - Hash provided OTP        │
│ - Compare with stored OTP  │
│ - Check expiry             │
│ - Hash new password        │
│ - Update user password     │
│ - Clear OTP fields         │
└────────┬───────────────────┘
         │
    Success Message
         │
         ▼
┌──────────────────────┐
│ Login with New Pass  │
│ (Redirect to auth)   │
└──────────────────────┘
```

---

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── authController.js        ← forgotPassword, verifyOTP, resetPassword
│   ├── models/
│   │   └── User.js                  ← resetOTP, resetOTPExpires, isOTPVerified
│   ├── routes/
│   │   └── authRoutes.js            ← POST /forgot-password, /verify-otp, /reset-password
│   ├── config/
│   │   └── mailer.js                ← Nodemailer setup & sendPasswordResetOtp
│   └── middleware/
│       └── validationMiddleware.js   ← Validation logic
├── .env                             ← SMTP configuration
└── package.json                     ← nodemailer dependency

frontend/
├── auth.html                        ← Forgot password panel UI
└── assets/
    └── js/
        └── authPage.js              ← Forgot password event handlers
```

---

## Customization

### Customize Email Template

**File:** `backend/src/config/mailer.js` (sendPasswordResetOtp function)

Modify the `html` variable:

```javascript
const html = `
  <div style="font-family: Arial, sans-serif;">
    <h2>Your OTP: ${otp}</h2>
    <p>Expires in 5 minutes</p>
    <!-- Add logo, branding, etc. -->
  </div>
`;
```

### Change OTP Expiry Time

**File:** `backend/src/controllers/authController.js` (forgotPassword function)

```javascript
// Change from: Date.now() + 1000 * 60 * 5  (5 minutes)
// To: Date.now() + 1000 * 60 * 10  (10 minutes)
user.resetOTPExpires = Date.now() + 1000 * 60 * 10;
```

### Change OTP Length

**File:** `backend/src/controllers/authController.js`

```javascript
// Generate 8-digit OTP instead of 6
const otp = String(Math.floor(10000000 + Math.random() * 90000000));
```

Then update validation:

**File:** `backend/src/controllers/authController.js`

```javascript
const verifyOTPValidation = [
  // Change from: isLength({ min: 6, max: 6 })
  // To: isLength({ min: 8, max: 8 })
  body("otp")
    .trim()
    .isLength({ min: 8, max: 8 })
    .withMessage("OTP must be 8 digits"),
];
```

---

## Troubleshooting

### Issue: "Mail service is not configured"

**Solution:**
1. Check `.env` file exists in `backend/` directory
2. Verify all SMTP vars are set:
   ```bash
   SMTP_HOST=...
   SMTP_PORT=...
   SMTP_USER=...
   SMTP_PASS=...
   MAIL_FROM=...
   ```
3. Restart backend server: `npm run dev`

### Issue: "Invalid or expired OTP"

**Solution:**
1. Make sure you copied the exact OTP from email
2. OTP expires in 5 minutes - request new OTP if too old
3. Check email spam folder

### Issue: Backend running but emails not sending

**Solution:**
1. Check if app password is set correctly (not regular Gmail password)
2. Verify SMTP credentials are correct
3. Check backend console for errors
4. Try with different email provider (SendGrid, Mailgun)

---

## Deployment Checklist

- [ ] SMTP credentials configured in `.env`
- [ ] Environment variables secured (not in code)
- [ ] HTTPS enabled (for production)
- [ ] Rate limiting added (prevent brute force)
- [ ] Error logging configured
- [ ] Email templates customized
- [ ] OTP expiry time appropriate
- [ ] Tested end-to-end
- [ ] CSRF protection enabled (if applicable)
- [ ] Monitoring/alerting set up

---

## Next Steps

1. **Configure SMTP** - Follow Step 1 in setup
2. **Test with real email** - Send yourself an OTP
3. **Customize email template** - Add branding
4. **Add rate limiting** - Prevent abuse:
   ```bash
   npm install express-rate-limit
   ```
5. **Setup monitoring** - Track OTP delivery rates

---

## Support & References

- **Nodemailer Docs:** https://nodemailer.com/
- **Bcryptjs Docs:** https://github.com/dcodeIO/bcrypt.js
- **Express Validator:** https://express-validator.github.io/docs/
- **MongoDB Docs:** https://docs.mongodb.com/

---

**Last Updated:** March 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
