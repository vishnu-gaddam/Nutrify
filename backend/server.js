import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Routes
import userRoutes from "./routes/userRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";
import healthDataRoutes from './routes/healthDataRoutes.js';
import mealTrackingRoutes from "./routes/mealTrackingRoutes.js";

// Models
import User from "./models/User.js";

dotenv.config();

// Initialize Express app
const app = express();

// Allowed origins for CORS
const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://nutrify-nu.vercel.app"]
  : ["http://localhost:3000"];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => { console.error(err.message); process.exit(1); });

// Routes
app.use("/api/users", userRoutes);
app.use("/api/meals", mealPlanRoutes);
app.use("/api/health-data", healthDataRoutes);
app.use("/api/meals", mealTrackingRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "NutriTracker API running 🚀",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "dev"
  });
});

// 404 handler
app.use("*", (req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {}
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);

// Create default admin
const createDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@nutritracker.com";
    const exists = await User.findOne({ email: adminEmail });
    
    if (!exists) {
      const adminPassword = "admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        name: "Platform Admin",
        age: 30,
        gender: "other",
        height: 170,
        weight: 70,
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });

      console.log("✅ Default admin created");
    }
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  }
};

createDefaultAdmin();
