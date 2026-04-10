const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const updateAdminCredentials = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/donateSphere", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Find the old admin (assuming first admin user)
    const oldAdmin = await User.findOne({ role: "admin" });

    if (!oldAdmin) {
      console.log("No admin user found. You may need to create one first.");
      process.exit(0);
    }

    console.log(`Found admin: ${oldAdmin.email}`);

    // New credentials
    const newEmail = "myadmin@2118.com";
    const newPassword = "@Ramji2118";

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin user
    oldAdmin.email = newEmail;
    oldAdmin.password = hashedPassword;
    await oldAdmin.save();

    console.log("✓ Admin credentials updated successfully!");
    console.log(`  Email: ${newEmail}`);
    console.log(`  Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error("Error updating admin:", error.message);
    process.exit(1);
  }
};

updateAdminCredentials();
