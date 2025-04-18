const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Diagnostic=require("../models/Diagnostic");

const router = express.Router();

// ROLE TO MODEL MAP
const roleModelMap = {
  doctor: Doctor,
  patient: Patient,
  diagnostic:Diagnostic,
};

// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      walletAddress,
      fullName,
      phone,
      specialization,
      hospital,
      experience,
      age,
      gender
    } = req.body;

    if (!email || !password || !role || !walletAddress) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const Model = roleModelMap[role];
    if (!Model) return res.status(400).json({ error: "Invalid role" });

    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUserData = {
      email,
      password: hashedPassword,
      role,
      walletAddress,
      fullName,
      phone,
    };

    if (role === "doctor") {
      newUserData = {
        ...newUserData,
        specialization,
        hospital,
        experience,
      };
    } else if (role === "patient") {
      newUserData = {
        ...newUserData,
        age,
        gender,
      };
    }

    const newUser = new Model(newUserData);
    await newUser.save();

    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const Model = roleModelMap[role];
    if (!Model) return res.status(400).json({ error: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.status(401).json({ error: `${role} not found` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const payload = {
      id: user._id,
      role: user.role,
      address: user.walletAddress,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      role,
      walletAddress: user.walletAddress,
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Login failed",details: err.message });
  }
});

module.exports = router;
