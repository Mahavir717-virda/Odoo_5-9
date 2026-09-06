import http from "http";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import v1Routes from "./routes/index.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import { initWebSocket } from "./services/socketService.js";

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

// Create HTTP Server & Attach WebSockets
const server = http.createServer(app);
initWebSocket(server);

// Start Server & Check Database Connection
server.listen(PORT, async () => {
  console.log(`🚀 PeoplePay360 Server running on port ${PORT}`);
  try {
    const { pool } = await import("./db.js");
    const res = await pool.query("SELECT current_database() AS db, inet_server_addr() AS host, inet_server_port() AS port");
    const isLocal = !process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("neon.tech");
    console.log(`✅ Database Connected: [${isLocal ? "LOCAL POSTGRESQL" : "NEON CLOUD"}] -> DB: "${res.rows[0].db}"`);
  } catch (dbErr) {
    console.error("❌ Database Connection Failed:", dbErr.message);
  }
});

export default app;
export { app, server };
