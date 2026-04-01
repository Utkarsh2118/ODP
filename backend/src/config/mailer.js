const nodemailer = require("nodemailer");

const isMailerConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
};

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

const sendPasswordResetOtp = async ({ toEmail, name, otp }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Mail service is not configured");
  }

  const subject = "DonateSphere Password Reset OTP";
  const text = `Hi ${name || "User"},\n\nYour OTP to reset password is: ${otp}\nThis OTP is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`;
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
    subject,
    text,
    html,
  });
};

const sendDonationReceipt = async ({ toEmail, userName, receiptBuffer, campaignTitle, amount }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Mail service is not configured");
  }

  const subject = "Your Donation Receipt - DonateSphere";
  const text = `Hi ${userName || "User"},\n\nThank you for your donation of ${amount} towards ${campaignTitle}.\n\nYour receipt is attached to this email.\n\nWarm regards,\nDonateSphere Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Thank You for Your Donation!</h2>
      <p>Hi ${userName || "User"},</p>
      <p>Thank you for your generous donation of <strong>${amount}</strong> towards the campaign:</p>
      <p style="font-size: 18px; font-weight: 700; color: #0f766e;">${campaignTitle}</p>
      <p>Your donation receipt is attached to this email. Please keep it for your records.</p>
      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
        Warm regards,<br/>
        <strong>DonateSphere Team</strong>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: "donation_receipt.pdf",
        content: receiptBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};

module.exports = {
  isMailerConfigured,
  sendPasswordResetOtp,
  sendDonationReceipt,
};
