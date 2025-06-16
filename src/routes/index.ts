import { Router } from "express";
import authRoutes from "./auth";
import feedRoutes from "./feed";
import postRoutes from "./posts";
import userRoutes from "./users";

const router = Router();

// Mount authentication routes
router.use("/auth", authRoutes);

// Mount user routes
router.use("/users", userRoutes);

// Mount post routes
router.use("/posts", postRoutes);

// Mount feed routes
router.use("/feed", feedRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
