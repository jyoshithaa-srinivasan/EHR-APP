const express = require('express');
const multer = require('multer');
const path = require('path');
const uploadFileToStoracha = require('../utils/ipfs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  console.log("🚀 File upload process started");

  // Log the incoming file information
  console.log("📁 File details:");
  console.log(`File Name: ${req.file.originalname}`);
  console.log(`File Size: ${req.file.size / 1024} KB`);
  console.log(`File Type: ${req.file.mimetype}`);
  console.log(`File Path: ${path.join(req.file.destination, req.file.filename)}`);

  try {
    const filePath = path.join(req.file.destination, req.file.filename);
    const category=req.body.category;
    
    // Log the file upload process to Storacha
    console.log("📤 Uploading the file to Storacha...");

    const cid = await uploadFileToStoracha(filePath);
    console.log(`📦 File uploaded successfully! CID: ${cid}`);
    
    // Sending the CID back to the client
    res.status(200).json({ cid,category});
    
    // Log success
    console.log("✅ File upload completed successfully.");
  } catch (error) {
    // Log error details if upload fails
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

module.exports = router;
