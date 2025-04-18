const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  walletAddress: { type: String, required: true },

  // Optional doctor profile fields
  fullName: String,
  phone: String,
  specialization: String,
  hospital: String,
  experience: String
});

module.exports = mongoose.model("user", userSchema);
