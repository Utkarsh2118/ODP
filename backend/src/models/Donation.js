const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMode: {
      type: String,
      enum: ["razorpay", "manual_qr"],
      default: "razorpay",
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    payerReference: {
      type: String,
      trim: true,
      default: null,
    },
    paymentNote: {
      type: String,
      trim: true,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "rejected"],
      default: "success",
    },
    donatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
