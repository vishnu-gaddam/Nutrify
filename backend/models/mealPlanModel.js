// models/mealPlanModel.js
import mongoose from "mongoose";

// ✅ Meal Schema with Rating
const mealSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "Unnamed Meal" },
  category: { type: String, required: true, default: "General" },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  ingredients: { type: String, default: "" },
  notes: { type: String, default: "" },
  isFavorite: { type: Boolean, default: false },
  addedByUser: { type: Boolean, default: false },
  image: { type: String, default: "/images/default.jpg" },
  addedAt: { type: Date, default: Date.now },
  // ✅ ADD RATING FIELD (1-5 stars)
  rating: { type: Number, min: 1, max: 5, default: 3 },
});

// ✅ Rotation State Schema (for round-robin meal rotation)
const rotationStateSchema = new mongoose.Schema({
  category: { type: String, required: true },
  lastIndex: { type: Number, default: -1 },
  usedMealIds: [{ type: String }], // Optional: for extra safety
}, { _id: false });

// ✅ Meal Plan Schema with Rotation + Auto-Reset
const mealPlanSchema = new mongoose.Schema({
  user: {
    type: String, // ✅ Must be String to match frontend user.id
    required: true,
    index: true,
  },
  meals: [mealSchema],
  // ✅ Track rotation per category
  rotationState: [rotationStateSchema],
  // ✅ Track last auto-reset (for weekly Monday reset)
  lastResetDate: { type: Date },
}, {
  timestamps: true,
});

// Ensure model is registered only once
export default mongoose.models.MealPlan || mongoose.model("MealPlan", mealPlanSchema);