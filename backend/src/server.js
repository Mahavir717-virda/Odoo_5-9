import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import v1Routes from "./routes/index.js";
import errorHandler from "./middleware/error.middleware.js";

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

export default app;
export { app };
