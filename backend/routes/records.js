const express = require("express");
const router = express.Router();

const { getWeb3, getContract } = require("../utils/contract");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const web3 = getWeb3();
    const ehr = await getContract(web3);
    const userAddress = req.user.address;
    console.log("Decoded JWT user:", req.user);


    const role = await ehr.methods.getRole(userAddress).call();
    console.log("Fetching records...");
    console.log("Role:", role);
    console.log("User address (requester):", userAddress);


    if (role.trim() === "patient") {
      // Logging before calling the contract function
      console.log("Calling getRecords with address:", userAddress);
      console.log("Request made by:", req.user.address);

      const records = await ehr.methods.getRecords(userAddress).call();

      const formatted = records.map((record) => ({
        ipfsHash: record.ipfsHash,
        category: record.category,
        timestamp: record.timestamp,
      }));

      console.log("Fetched patient records:", formatted);

      return res.json(formatted);

    } else if (role.trim() === "doctor") {
      console.log("Doctor accessing accessible records");

      const [records, owners] = await ehr.methods.getAccessibleRecords().call();

      const formatted = records.map((record, i) => ({
        ipfsHash: record.ipfsHash,
        category: record.category,
        timestamp: record.timestamp,
        patientAddress: owners[i],
      }));

      console.log("Fetched authorized records for doctor:", formatted);

      return res.json(formatted);

    } else {
      return res.status(403).json({ error: "Only doctors and patients can view records." });
    }

  } catch (err) {
    console.error("Error fetching records:", err);
    res.status(500).json({ error: "An error occurred while fetching records." });
  }
});

module.exports = router;
