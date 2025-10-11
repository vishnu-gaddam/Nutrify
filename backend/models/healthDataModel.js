// backend/models/healthDataModel.js
import mongoose from 'mongoose';

const healthDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  steps: {
    type: Number,
    default: 0
  },
  water: {
    type: Number, // glasses
    default: 0
  },
  sleep: {
    type: Number, // hours
    default: 0
  },
  exercise: {
    type: Number, // minutes
    default: 0
  },
  weight: {
    type: Number, // kg
    default: null
  },
  // Nutrition fields - REMOVED CARBS, ADDED FIBER
  calories: {
    type: Number,
    default: 0
  },
  protein: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  },
  fiber: {
    type: Number,
    default: 0
  },
  mealConsistency: {
    type: Number, // percentage
    default: 0
  }
}, {
  timestamps: true
});

// Ensure only one entry per user per day
healthDataSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('HealthData', healthDataSchema);