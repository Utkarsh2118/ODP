const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const User = require("../models/User");

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone number must be between 7 and 20 characters"),
  body("address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 250 })
    .withMessage("Address cannot exceed 250 characters"),
  body("bio")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters"),
  body("profileImage")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 300000 })
    .withMessage("Profile image data is too large"),
];

const changePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Confirm password must match new password"),
];

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "name email phone address bio profileImage role createdAt"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({ success: true, user });
};

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const { name, phone, address, bio, profileImage } = req.body;

  if (typeof name === "string") user.name = name.trim();
  if (typeof phone === "string") user.phone = phone.trim();
  if (typeof address === "string") user.address = address.trim();
  if (typeof bio === "string") user.bio = bio.trim();
  if (typeof profileImage === "string") user.profileImage = profileImage.trim();

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      profileImage: user.profileImage,
      role: user.role,
    },
  });
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Old password is incorrect" });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return res.status(400).json({ success: false, message: "New password must be different" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.status(200).json({ success: true, message: "Password changed successfully" });
};

module.exports = {
  updateProfileValidation,
  changePasswordValidation,
  getProfile,
  updateProfile,
  changePassword,
};
