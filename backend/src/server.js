require("dotenv").config();
const express = require("express");
const cors = require("cors");
const v1Routes = require("./routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Version 1 Routes
app.use("/api/v1", v1Routes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 Server running on port ${PORT}`);
});

module.exports = app;
