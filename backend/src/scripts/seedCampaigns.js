const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Campaign = require("../models/Campaign");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sampleCampaigns = [
  {
    title: "Education for Rural Children",
    description:
      "Support school kits, teacher training, and scholarships for children in underserved villages.",
    goalAmount: 500000,
    fundsRaised: 85000,
    imageUrl: "",
  },
  {
    title: "Emergency Medical Aid",
    description:
      "Help provide urgent surgeries, medicines, and hospital support for low-income families.",
    goalAmount: 750000,
    fundsRaised: 124000,
    imageUrl: "",
  },
  {
    title: "Flood Relief and Rehabilitation",
    description:
      "Contribute to food, shelter, hygiene kits, and home-rebuilding support in flood-affected areas.",
    goalAmount: 1000000,
    fundsRaised: 310000,
    imageUrl: "",
  },
];

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const count = await Campaign.countDocuments({ isActive: true });
    if (count > 0) {
      console.log("Active campaigns already exist. Skipping seed.");
      process.exit(0);
    }

    await Campaign.insertMany(sampleCampaigns);
    console.log("Sample campaigns inserted successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Campaign seed failed:", error.message);
    process.exit(1);
  }
};

run();
