const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// GET /api/patient/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-password'); // exclude password
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/diagnostic-records", async (req, res) => {
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
