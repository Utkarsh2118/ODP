const PDFDocument = require("pdfkit");

const generateReceiptBuffer = ({ donation, user, campaign }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text("Online Donation Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt ID: ${donation._id}`);
    doc.text(`Date: ${new Date(donation.donatedAt).toLocaleString()}`);
    doc.moveDown();
    doc.text(`Donor Name: ${user.name}`);
    doc.text(`Donor Email: ${user.email}`);
    doc.moveDown();
    doc.text(`Campaign: ${campaign.title}`);
    doc.text(`Amount: ${donation.currency} ${donation.amount}`);
    doc.text(`Payment Mode: ${donation.paymentMode === "manual_qr" ? "Manual QR" : "Razorpay"}`);
    doc.text(`Payment Reference: ${donation.payerReference || donation.razorpayPaymentId || "N/A"}`);
    if (donation.razorpayOrderId) {
      doc.text(`Order ID: ${donation.razorpayOrderId}`);
    }
    doc.moveDown();
    doc.text("Thank you for your contribution.", { align: "left" });

    doc.end();
  });
};

module.exports = {
  generateReceiptBuffer,
};
