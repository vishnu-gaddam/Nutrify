import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Routes
import userRoutes from "./routes/userRoutes.js";
import mealPlanRoutes from "./routes/mealPlanRoutes.js";
import healthDataRoutes from "./routes/healthDataRoutes.js";
import mealTrackingRoutes from "./routes/mealTrackingRoutes.js";

// Models
import User from "./models/User.js";

dotenv.config();

// Initialize Express app
const app = express();


// ✅ Allowed origins
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://nutrify-n.vercel.app",
        "https://nutrify-ny.vercel.app",
        "https://nutrify-n.onrender.com",
        "https://nutrify-1-f0vl.onrender.com"
      ]
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

    // ✅ CORS middleware for all routes
    app.use(
      cors({
        origin: (origin, callback) => {
          // allow requests with no origin (like Postman or server-to-server)
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.warn("❌ Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS")); // send proper error for disallowed origin
          }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // allow cookies
      })
    );

    // ✅ Preflight (OPTIONS) requests
    app.options("*", cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }));

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ MongoDB connection
// ✅ Validate MONGO_URI before connecting
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in environment variables.");
  console.error("👉 Go to Render Dashboard → Environment Variables and add MONGO_URI");
  process.exit(1);
}

mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/meals", mealPlanRoutes);
app.use("/api/health-data", healthDataRoutes);
app.use("/api/meals", mealTrackingRoutes);

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "NutriTracker API running 🚀",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ 404 handler
app.use("*", (req, res) => res.status(404).json({ message: "Route not found" }));

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
});

// ✅ Create default admin if not exists
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
        role: "admin",
      });

      console.log("✅ Default admin created");
    }
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  }
};

createDefaultAdmin();
