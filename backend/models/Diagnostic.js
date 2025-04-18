const mongoose = require("mongoose");

const diagnosticSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, required: true },
  centerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, default: "diagnostic" } // <- add this
});


module.exports = mongoose.model("Diagnostic", diagnosticSchema);
