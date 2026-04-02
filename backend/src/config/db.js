const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to backend/.env");
  }

  if (
    process.env.MONGO_URI.includes("<username>") ||
    process.env.MONGO_URI.includes("<password>")
  ) {
    throw new Error(
      "MONGO_URI contains placeholder values. Replace <username> and <password> with real MongoDB credentials."
    );
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
