const express = require("express");
const validate = require("../middleware/validationMiddleware");
const catchAsync = require("../middleware/catchAsync");
const { protect } = require("../middleware/authMiddleware");
const {
  updateProfileValidation,
  changePasswordValidation,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", protect, catchAsync(getProfile));
router.put("/profile", protect, updateProfileValidation, validate, catchAsync(updateProfile));
router.put(
  "/change-password",
  protect,
  changePasswordValidation,
  validate,
  catchAsync(changePassword)
);

module.exports = router;
