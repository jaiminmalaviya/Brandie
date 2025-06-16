import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { errorHandler, notFound } from "./middleware/error";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
