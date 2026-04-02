const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { body } = require("express-validator");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { isMailerConfigured, sendPasswordResetOtp } = require("../config/mailer");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
];

const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("otp").trim().isLength({ min: 4, max: 8 }).withMessage("Valid OTP is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const verifyOTPValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "user",
  });

  return res.status(201).json({
    success: true,
    message: "Registration successful",
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  return res.status(200).json({
    success: true,
    user,
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!isMailerConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Mail service is not configured on server",
    });
  }

  // Always return a generic response to avoid account enumeration.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If an account exists with that email, an OTP has been sent.",
    });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  // Store OTP and set 5-minute expiry
  user.resetOTP = hashedOtp;
  user.resetOTPExpires = Date.now() + 1000 * 60 * 5; // 5 minutes
  user.isOTPVerified = false;
  await user.save();

  try {
    await sendPasswordResetOtp({
      toEmail: user.email,
      name: user.name,
      otp,
    });
  } catch (error) {
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP email right now. Please check SMTP settings in backend/.env.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "If an account exists with that email, an OTP has been sent.",
  });
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  // Hash the provided OTP
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  // Find user with valid OTP
  const user = await User.findOne({
    email,
    resetOTP: hashedOtp,
    resetOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Mark OTP as verified
  user.isOTPVerified = true;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully. You can now reset your password.",
  });
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email,
    resetOTP: hashedOtp,
    resetOTPExpires: { $gt: Date.now() },
    isOTPVerified: true,
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP. Please request a new one.",
    });
  }

  // Hash the new password with bcrypt
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  
  // Clear OTP fields
  user.resetOTP = null;
  user.resetOTPExpires = null;
  user.isOTPVerified = false;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successful. Please login with your new password.",
  });
};

const adminSeedValidation = [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("adminSecret").notEmpty(),
];

const createAdmin = async (req, res) => {
  const { name, email, password, adminSecret } = req.body;

  if (!process.env.ADMIN_BOOTSTRAP_SECRET || adminSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return res.status(403).json({ success: false, message: "Invalid admin bootstrap secret" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({ name, email, password: hashedPassword, role: "admin" });

  return res.status(201).json({
    success: true,
    message: "Admin created",
    user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation,
  adminSeedValidation,
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  createAdmin,
};
