const express = require("express");
const validate = require("../middleware/validationMiddleware");
const catchAsync = require("../middleware/catchAsync");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createOrderValidation,
  manualDonationValidation,
  verifyPaymentValidation,
  donationIdValidation,
  reviewDonationValidation,
  createOrder,
  verifyPayment,
  createManualDonationRequest,
  getMyDonations,
  getAllDonations,
  reviewManualDonation,
  downloadReceipt,
} = require("../controllers/donationController");

const router = express.Router();

router.post("/create-order", protect, createOrderValidation, validate, catchAsync(createOrder));
router.post("/verify", protect, verifyPaymentValidation, validate, catchAsync(verifyPayment));
router.post("/manual-request", protect, manualDonationValidation, validate, catchAsync(createManualDonationRequest));
router.get("/me", protect, catchAsync(getMyDonations));
router.get("/admin/all", protect, authorize("admin"), catchAsync(getAllDonations));
router.patch(
  "/admin/:id/review",
  protect,
  authorize("admin"),
  reviewDonationValidation,
  validate,
  catchAsync(reviewManualDonation)
);
router.get("/:id/receipt", protect, donationIdValidation, validate, catchAsync(downloadReceipt));

module.exports = router;
