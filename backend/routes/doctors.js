const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/Doctor"); // adjust path if needed
const { getWeb3, getContract } = require("../utils/contract");
const Patient = require("../models/Patient");


// @route   GET /api/doctor/profile
// @desc    Get doctor profile
// @access  Private (Doctor)
router.get("/profile", authMiddleware, async (req, res) => {
    console.log("Authenticated user:", req.user); // ✅ Add this line
    try {
      const doctor = await User.findOne({ _id: req.user.id, role: "doctor" }).select("-password");
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json(doctor);
    } catch (err) {
      console.error("Error fetching doctor profile:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  //get all the doctors
  router.get("/getdoctors", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "patient") {
        return res.status(403).json({ message: "Access denied. Patients only." });
      }
  
      const doctors = await User.find({ role: "doctor" }).select("-password");
      res.json(doctors);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("/patients", authMiddleware, async (req, res) => {
    try {
      const doctorWallet = req.headers["x-wallet-address"]; // Access wallet address sent from frontend
  
      if (!doctorWallet) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
  
      console.log("✅ /api/doctor/patients called by:", doctorWallet);
  
      if (req.user.role !== "doctor") {
        return res.status(403).json({ message: "Access denied. Doctors only." });
      }
  
      console.log("checked role");
  
      const web3 = getWeb3();
      const contract = await getContract(web3);
  
      console.log("opening contract");
  
      const result = await contract.methods
        .getAccessibleRecords()
        .call({ from: doctorWallet });
  
      const patientAddrs = result[0];
      const ipfsHashes = result[1];
      const categories = result[2];
      const timestamps = result[3];
  
      console.log("📥 Accessible records count:", ipfsHashes.length);
  
      const patientsMap = new Map();
  
      // Group records by patient
      for (let i = 0; i < patientAddrs.length; i++) {
        const patient = patientAddrs[i];
        const record = {
          ipfsHash: ipfsHashes[i],
          category: categories[i],
          timestamp: timestamps[i],
        };
  
        if (!patientsMap.has(patient)) {
          patientsMap.set(patient, []);
        }
  
        patientsMap.get(patient).push(record);
      }
  
      const patientsWithRecords = [];
  
      for (const [walletAddress, records] of patientsMap.entries()) {
        const patientData = await Patient.findOne({ walletAddress }).select("-password");
  
        if (patientData) {
          patientsWithRecords.push({
            fullName: patientData.fullName,
            email: patientData.email,
            walletAddress: patientData.walletAddress,
            age: patientData.age,
            gender: patientData.gender,
            records,
          });
        }
      }
  
      return res.json({ patients: patientsWithRecords });
    } catch (err) {
      console.error("Error fetching patients with records:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  });
  
  
  
  
  
  module.exports = router;
  
