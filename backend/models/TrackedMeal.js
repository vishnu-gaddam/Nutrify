// models/TrackedMeal.js
import mongoose from "mongoose";

const trackedMealSchema = new mongoose.Schema({
  userId: {
    type: String, // Match your frontend user.id (string)
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    default: "Unnamed Meal"
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  protein: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  fats: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  fiber: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  carbs: {
    type: Number,
    min: 0,
    default: 0
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'meal'
  },
  // This is crucial for your dashboard charts
  addedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
trackedMealSchema.index({ userId: 1, addedAt: -1 });

export default mongoose.models.TrackedMeal || mongoose.model("TrackedMeal", trackedMealSchema);