require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const ipfsRoutes = require("./routes/ipfs");
const recordRoutes = require("./routes/records");
const diagnosticRoutes = require("./routes/diagnostic");
const doctorRoutes = require("./routes/doctors");
const patientRoutes=require("./routes/patients");




const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patient",patientRoutes);

app.use("/api/diagnostic", diagnosticRoutes);

app.use("/api/ipfs", ipfsRoutes);
app.use("/api/records", recordRoutes);


  

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB Error:", err);
});

app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});
