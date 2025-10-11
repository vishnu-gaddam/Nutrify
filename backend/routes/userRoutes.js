import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addProgress,
  getAllUsers,
  getUserStats
} from "../controllers/userController.js";

import { protect, adminOnly, rateLimit } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", rateLimit, registerUser);
router.post("/login", rateLimit, loginUser);

// Protected routes
router.get("/me", protect, getUserProfile);
router.put("/me", protect, updateUserProfile);
router.post("/progress", protect, addProgress);

// Admin only routes
router.get("/all", protect, adminOnly, getAllUsers);
router.get("/stats", protect, adminOnly, getUserStats);

export default router;
