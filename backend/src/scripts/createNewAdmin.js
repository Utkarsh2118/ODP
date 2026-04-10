const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const createNewAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/donateSphere", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // New credentials
    const newEmail = "myadmin@2118.com";
    const newPassword = "@Ramji2118";
    const name = "Admin";

    // Check if admin already exists
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log(`Admin already exists: ${existing.email}`);
      console.log("Deleting old admin...");
      await User.deleteOne({ _id: existing._id });
      console.log("Old admin deleted.");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Create new admin
    const admin = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✓ Admin user created successfully!");
    console.log(`  Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createNewAdmin();
