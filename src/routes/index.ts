import { Router } from "express";
import authRoutes from "./auth";

const router = Router();

// Mount authentication routes
router.use("/auth", authRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
