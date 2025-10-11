import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT token
const generateToken = (id, role, name) => {
  return jwt.sign({ id, role, name }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc Register new user
// @route POST /api/users/signup
// @access Public
export const registerUser = async (req, res) => {
  try {
    const { name, age, gender, height, weight, email, password, role } = req.body;

    if (!name || !age || !gender || !height || !weight || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const bmi = weight / ((height / 100) * (height / 100));

    const user = await User.create({
      name: name.trim(),
      age: parseInt(age),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      email: email.toLowerCase(),
      password: hashedPassword,
      bmi,
      role: role || "user",
    });

    if (user) {
      await user.addProgress(weight, 0, "Initial registration");
      const token = generateToken(user._id, user.role, user.name);

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          gender: user.gender,
          height: user.height,
          weight: user.weight,
          bmi: user.bmi.toFixed(1),
          bmiCategory: user.getBMICategory(),
          role: user.role,
          lastLogin: user.lastLogin,
        },
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc Authenticate user & get token
// @route POST /api/users/login
// @access Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role, user.name);

    res.json({
      message: "Login successful",
      token,
      user: {
       id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      bmi: user.bmi.toFixed(1),
      bmiCategory: user.getBMICategory(),
      role: user.role,
      lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc Get user profile
// @route GET /api/users/me
// @access Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      bmi: user.bmi.toFixed(1),
      bmiCategory: user.getBMICategory(),
      role: user.role,
      progress: user.progress.slice(-10),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update user profile
// @route PUT /api/users/me
// @access Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, age, height, weight, email } = req.body;

    if (name) user.name = name.trim();
    if (age) user.age = parseInt(age);
    if (height) user.height = parseFloat(height);
    if (weight) {
      const oldWeight = user.weight;
      user.weight = parseFloat(weight);
      if (oldWeight !== user.weight) {
        await user.addProgress(user.weight, 0, "Weight update");
      }
    }
    if (email) user.email = email.toLowerCase();

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        height: updatedUser.height,
        weight: updatedUser.weight,
        bmi: updatedUser.bmi.toFixed(1),
        bmiCategory: updatedUser.getBMICategory(),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Add progress entry
// @route POST /api/users/progress
// @access Private
export const addProgress = async (req, res) => {
  try {
    const { weight, calories, notes } = req.body;
    if (!weight) return res.status(400).json({ message: "Weight is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.addProgress(parseFloat(weight), parseInt(calories) || 0, notes);

    res.json({
      message: "Progress added successfully",
      progress: user.progress[user.progress.length - 1],
      currentBMI: user.bmi.toFixed(1),
      bmiCategory: user.getBMICategory(),
    });
  } catch (error) {
    console.error("Add progress error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 });

    const usersWithStats = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      bmi: user.bmi.toFixed(1),
      bmiCategory: user.getBMICategory(),
      progressEntries: user.progress.length,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      isActive: user.isActive,
    }));

    res.json({ count: users.length, users: usersWithStats });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get user statistics (Admin only)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ role: "user", isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      role: "user",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const bmiStats = await User.aggregate([
      { $match: { role: "user" } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$bmi", 18.5] }, then: "Underweight" },
                { case: { $lt: ["$bmi", 25] }, then: "Normal" },
                { case: { $lt: ["$bmi", 30] }, then: "Overweight" },
              ],
              default: "Obese",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ totalUsers, activeUsers, newUsersThisMonth, bmiDistribution: bmiStats });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
