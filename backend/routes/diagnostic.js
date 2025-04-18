const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Diagnostic = require("../models/Diagnostic");
const authMiddleware = require("../middleware/auth");
const Patient = require("../models/Patient");




const router = express.Router();

// ✅ Diagnostic Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, walletAddress, centerName, contactNumber, address } = req.body;

    if (!email || !password || !walletAddress || !centerName || !contactNumber || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await Diagnostic.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDiagnostic = new Diagnostic({
      email,
      password: hashedPassword,
      walletAddress,
      centerName,
      contactNumber,
      address,
    });

    await newDiagnostic.save();
    res.status(201).json({ message: "Diagnostic center registered successfully" });
  } catch (err) {
    console.error("❌ Diagnostic Registration Error:", err);
    res.status(500).json({ error: "Diagnostic registration failed", details: err.message });
  }
});

// ✅ Diagnostic Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Diagnostic.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const payload = {
      id: user._id,
      role: "diagnostic",
      address: user.walletAddress,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      role: "diagnostic",
      walletAddress: user.walletAddress,
    });
  } catch (err) {
    console.error("❌ Diagnostic Login Error:", err);
    res.status(500).json({ error: "Diagnostic login failed" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  console.log("Authenticated user:", req.user); // ✅ See what's decoded from JWT

  try {
    // 🧠 Ensure we're fetching a diagnostic, not doctor
    const diagnostic = await Diagnostic.findOne({ _id: req.user.id, role: "diagnostic" }).select("-password");

    if (!diagnostic) {
      return res.status(404).json({ message: "Diagnostic center not found" });
    }

    res.json(diagnostic);
  } catch (err) {
    console.error("Error fetching diagnostic profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});



// GET all diagnostic centers
router.get("/centers", authMiddleware, async (req, res) => {
  try {
    const centers = await Diagnostic.find({}, "centerName walletAddress address"); // Only select necessary fields
    res.json(centers);
  } catch (error) {
    console.error("Error fetching diagnostic centers:", error);
    res.status(500).json({ error: "Failed to fetch diagnostic centers" });
  }
});

const { uploadReport } = require("../utils/web3DiagnosticUtils");

router.post("/upload-report", authMiddleware, async (req, res) => {
  const { patientAddress, ipfsHash, category } = req.body;

  if (!patientAddress || !ipfsHash || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const tx = await uploadReport(req.user.address, patientAddress, ipfsHash, category);
    res.json({ message: "Report uploaded successfully", transaction: tx });
  } catch (err) {
    console.error("❌ Upload Report Error:", err);
    res.status(500).json({ error: "Failed to upload diagnostic report" });
  }
});

const { getReports } = require("../utils/web3DiagnosticUtils");

router.get("/reports", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ error: "Only patients can view reports" });
    }

    const reports = await getReports(req.user.address);
    res.json(reports);
  } catch (err) {
    console.error("❌ Fetch Reports Error:", err);
    res.status(500).json({ error: "Failed to fetch diagnostic reports" });
  }
});


const { getPatientsWhoGrantedAccess } = require("../utils/web3DiagnosticUtils");

// Fetch patients who granted access to the logged-in diagnostic center
// Fetch patients who granted access to the logged-in diagnostic center
router.get("/granted-patients", authMiddleware, async (req, res) => {
  try {
    const centerAddress = req.user.address; // Get address from JWT token
    
    // Step 1: Fetch patient wallet addresses from the smart contract
    const patientsWalletAddresses = await getPatientsWhoGrantedAccess(centerAddress); 

    // Step 2: Fetch patient details from MongoDB using the wallet addresses
    const patients = await Patient.find({
      walletAddress: { $in: patientsWalletAddresses }
    });

    res.json(patients); // Return the patient details (including wallet address)
  } catch (err) {
    console.error("❌ Error fetching granted patients:", err);
    res.status(500).json({ error: "Failed to fetch granted patients" });
  }
});

// In routes/diagnosticRoutes.js
router.get("/diagnostic-records", authMiddleware, async (req, res) => {
  try {
    const patientAddress = req.user.walletAddress;
    const reports = await getReportsForPatient(patientAddress); // assuming a helper function
    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ message: "Error fetching reports" });
  }
});





module.exports = router;

