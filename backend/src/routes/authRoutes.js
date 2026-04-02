const express = require("express");
const validate = require("../middleware/validationMiddleware");
const { protect } = require("../middleware/authMiddleware");
const catchAsync = require("../middleware/catchAsync");
const {
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
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerValidation, validate, catchAsync(register));
router.post("/login", loginValidation, validate, catchAsync(login));
router.post("/forgot-password", forgotPasswordValidation, validate, catchAsync(forgotPassword));
router.post("/verify-otp", verifyOTPValidation, validate, catchAsync(verifyOTP));
router.post("/reset-password", resetPasswordValidation, validate, catchAsync(resetPassword));
router.get("/me", protect, catchAsync(getProfile));
router.post("/seed-admin", adminSeedValidation, validate, catchAsync(createAdmin));

module.exports = router;
