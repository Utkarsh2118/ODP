const crypto = require("crypto");
const { body, param } = require("express-validator");
const { getRazorpayClient, isRazorpayConfigured } = require("../config/razorpay");
const Campaign = require("../models/Campaign");
const Donation = require("../models/Donation");
const User = require("../models/User");
const { generateReceiptBuffer } = require("../utils/receiptGenerator");

const createOrderValidation = [
  body("campaignId").isMongoId().withMessage("Invalid campaign ID"),
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be greater than 0"),
];

const manualDonationValidation = [
  body("campaignId").isMongoId().withMessage("Invalid campaign ID"),
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be greater than 0"),
  body("payerReference")
    .trim()
    .isLength({ min: 4, max: 80 })
    .withMessage("Reference must be between 4 and 80 characters"),
  body("paymentNote")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Payment note cannot exceed 250 characters"),
];

const verifyPaymentValidation = [
  body("campaignId").isMongoId().withMessage("Invalid campaign ID"),
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be greater than 0"),
  body("razorpay_order_id").notEmpty().withMessage("Order ID is required"),
  body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required"),
  body("razorpay_signature").notEmpty().withMessage("Signature is required"),
];

const donationIdValidation = [param("id").isMongoId().withMessage("Invalid donation ID")];

const reviewDonationValidation = [
  param("id").isMongoId().withMessage("Invalid donation ID"),
  body("action")
    .isIn(["approve", "reject"])
    .withMessage("Action must be either approve or reject"),
];

const createOrder = async (req, res) => {
  const { campaignId, amount } = req.body;

  if (!isRazorpayConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Razorpay is not configured on the server",
    });
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign || !campaign.isActive) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  try {
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return res.status(201).json({
      success: true,
      order,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to create order: ${error.message}`,
    });
  }
};

const verifyPayment = async (req, res) => {
  const { campaignId, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!isRazorpayConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Razorpay is not configured on the server",
    });
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const exists = await Donation.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (exists) {
      return res.status(409).json({ success: false, message: "Payment already recorded" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const donation = await Donation.create({
      user: req.user.id,
      campaign: campaignId,
      amount: Number(amount),
      paymentMode: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "success",
    });

    campaign.fundsRaised += Number(amount);
    await campaign.save();

    const user = await User.findById(req.user.id).select("name email");

    const receipt = {
      receiptId: donation._id,
      donor: user.name,
      email: user.email,
      campaign: campaign.title,
      amount: donation.amount,
      currency: donation.currency,
      donatedAt: donation.donatedAt,
      transactionId: donation.razorpayPaymentId,
    };

    return res.status(200).json({
      success: true,
      message: "Payment verified and donation recorded",
      donation,
      receipt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Payment verification error: ${error.message}`,
    });
  }
};

const createManualDonationRequest = async (req, res) => {
  const { campaignId, amount, payerReference, paymentNote } = req.body;

  const campaign = await Campaign.findById(campaignId);
  if (!campaign || !campaign.isActive) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  const donation = await Donation.create({
    user: req.user.id,
    campaign: campaignId,
    amount: Number(amount),
    paymentMode: "manual_qr",
    payerReference,
    paymentNote: paymentNote || null,
    status: "pending",
  });

  return res.status(201).json({
    success: true,
    message: "Payment submitted for verification. Admin will review it shortly.",
    donation,
  });
};

const getMyDonations = async (req, res) => {
  const donations = await Donation.find({ user: req.user.id })
    .populate("campaign", "title description")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, donations });
};

const getAllDonations = async (req, res) => {
  const donations = await Donation.find()
    .populate("user", "name email")
    .populate("campaign", "title")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, donations });
};

const reviewManualDonation = async (req, res) => {
  const { action } = req.body;
  const donation = await Donation.findById(req.params.id).populate("campaign");

  if (!donation) {
    return res.status(404).json({ success: false, message: "Donation not found" });
  }

  if (donation.paymentMode !== "manual_qr") {
    return res.status(400).json({ success: false, message: "Only manual QR donations can be reviewed" });
  }

  if (donation.status !== "pending") {
    return res.status(409).json({ success: false, message: "Donation request already reviewed" });
  }

  const approved = action === "approve";

  donation.status = approved ? "success" : "rejected";
  donation.reviewedBy = req.user.id;
  donation.reviewedAt = new Date();
  await donation.save();

  if (approved) {
    const campaign = await Campaign.findById(donation.campaign._id);
    if (campaign) {
      campaign.fundsRaised += Number(donation.amount);
      await campaign.save();
    }
  }

  return res.status(200).json({
    success: true,
    message: approved ? "Donation approved and added to campaign" : "Donation rejected",
    donation,
  });
};

const downloadReceipt = async (req, res) => {
  const donation = await Donation.findById(req.params.id).populate("user campaign");

  if (!donation) {
    return res.status(404).json({ success: false, message: "Donation not found" });
  }

  if (donation.user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (donation.status !== "success") {
    return res.status(400).json({ success: false, message: "Receipt available only for successful donations" });
  }

  const buffer = await generateReceiptBuffer({
    donation,
    user: donation.user,
    campaign: donation.campaign,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${donation._id.toString()}.pdf`
  );

  return res.send(buffer);
};

module.exports = {
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
};
