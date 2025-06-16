import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { errorHandler, notFound } from "./middleware/error";
import {
  corsOptions,
  generalRateLimit,
  requestSizeLimit,
  securityHeaders,
  validateUserAgent,
} from "./middleware/security";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware (should be first)
app.use(securityHeaders);
app.use(validateUserAgent);
app.use(requestSizeLimit);

// CORS middleware with enhanced configuration
app.use(cors(corsOptions));

// Rate limiting (apply to all requests)
app.use(generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// API routes
app.use("/api", routes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Brandie Social Media API",
    status: "Server is running!",
    version: "1.0.0",
  });
});

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
});

export default app;
