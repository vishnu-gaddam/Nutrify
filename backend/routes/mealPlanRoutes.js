import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import MealPlan from "../models/mealPlanModel.js";

const router = express.Router();

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEALS_JSON_PATH = path.join(__dirname, "../meals_database.json");

// Load JSON
let mealsData = [];
try {
  const raw = fs.readFileSync(MEALS_JSON_PATH, "utf-8");
  mealsData = JSON.parse(raw);
  console.log(`Loaded ${mealsData.length} meals from ${MEALS_JSON_PATH}`);
} catch (err) {
  console.error("Failed to load meals JSON:", err);
  mealsData = [];
}

// Helper: BMI Category
function mapBmiToCategoryLabel(bmi) {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

function normalizeBmiCategory(str) {
  if (!str) return "";
  return str.replace(/[^a-zA-Z]/g, "").toLowerCase();
}

// Helper: Age Group
function parseAgeGroup(ageGroupStr) {
  if (!ageGroupStr) return null;
  const match = ageGroupStr.match(/(\d+)\D+(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

function filterByAge(meal, age) {
  const range = parseAgeGroup(meal["Age Group"]);
  if (!range) return false;
  return age >= range[0] && age <= range[1];
}

// Helper: Check if Monday has passed since last reset
function isMondayPassedSince(lastDate) {
  if (!lastDate) return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastReset = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  // If today is Monday and last reset wasn't today
  if (today.getDay() === 1 && today.getTime() !== lastReset.getTime()) {
    return true;
  }

  // If last reset was before this Monday
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - today.getDay() + 1);
  if (thisMonday > today) {
    thisMonday.setDate(thisMonday.getDate() - 7);
  }

  return lastReset < thisMonday;
}

// POST /api/meals/plan — ✅ FIXED: Only exclude by _id, not by name
router.post("/plan", async (req, res) => {
  try {
    const { bmi, age, userId } = req.body; // ✅ page is not needed — rotation is stateful
    if (bmi === undefined || age === undefined || !userId) {
      return res.status(400).json({ error: "Missing bmi, age, or userId" });
    }

    // Get or create user's meal plan
    let mealPlan = await MealPlan.findOne({ user: userId });
    if (!mealPlan) {
      mealPlan = new MealPlan({
        user: userId,
        meals: [],
        rotationState: ["Breakfast", "Lunch", "Snack", "Dinner"].map(cat => ({
          category: cat,
          lastIndex: -1,
          usedMealIds: []
        })),
        lastResetDate: new Date()
      });
      await mealPlan.save();
    }

    // Initialize rotation state if missing
    const categories = ["Breakfast", "Lunch", "Snack", "Dinner"];
    for (const cat of categories) {
      if (!mealPlan.rotationState.find(rs => rs.category === cat)) {
        mealPlan.rotationState.push({ category: cat, lastIndex: -1, usedMealIds: [] });
      }
    }

    // Auto-reset every Monday
    if (isMondayPassedSince(mealPlan.lastResetDate)) {
      console.log("🔄 Auto-resetting rotation for Monday for user:", userId);
      for (const rs of mealPlan.rotationState) {
        rs.lastIndex = -1;
      }
      mealPlan.lastResetDate = new Date();
      await mealPlan.save();
    }

    // Get saved meal IDs to exclude (by _id only)
    const savedMealIds = new Set(mealPlan.meals.map(m => String(m._id)));

    const plan = {};

    for (const category of categories) {
      let filtered = mealsData.filter(
        (m) =>
          filterByAge(m, age) &&
          normalizeBmiCategory(m["BMI Category"]) === mapBmiToCategoryLabel(bmi) &&
          (m["Meal Type"] || "").toLowerCase() === category.toLowerCase()
      );

      // Fallback: any meal of type if no exact match
      if (filtered.length === 0) {
        filtered = mealsData.filter(
          (m) => (m["Meal Type"] || "").toLowerCase() === category.toLowerCase()
        );
      }

      if (filtered.length === 0) {
        plan[category] = [];
        continue;
      }

      // ✅ FIXED: ONLY exclude by _id (not by name!)
      filtered = filtered.filter(meal => {
        if (meal._id && savedMealIds.has(String(meal._id))) {
          return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        plan[category] = [];
        continue;
      }

      // Sort by rating (higher first)
      filtered = filtered.sort((a, b) => {
        const ratingA = a.rating || 3;
        const ratingB = b.rating || 3;
        return ratingB - ratingA;
      });

      // Get rotation state
      const rotationState = mealPlan.rotationState.find(rs => rs.category === category);
      let startIndex = (rotationState.lastIndex + 1) % filtered.length;
      let mealsToPick = [];

      // Pick next 2 meals (allow same name if needed)
      let attempts = 0;
      while (mealsToPick.length < 2 && attempts < filtered.length) {
        const meal = filtered[startIndex];
        mealsToPick.push(meal); // ✅ No name deduplication here
        startIndex = (startIndex + 1) % filtered.length;
        attempts++;
      }

      plan[category] = mealsToPick;

      // Update rotation state
      rotationState.lastIndex = startIndex - 1;
      if (rotationState.lastIndex < 0) rotationState.lastIndex = filtered.length - 1;
    }

    await mealPlan.save();
    return res.json({ plan });

  } catch (err) {
    console.error("Error generating meal plan:", err);
    return res.status(500).json({ error: "Error generating meal plan: " + err.message });
  }
});

// POST /api/meals/save — ✅ Keep as-is
router.post("/save", async (req, res) => {
  try {
    const { userId, meal } = req.body;

    if (!userId || !meal) {
      return res.status(400).json({ error: "userId and meal required" });
    }

    console.log("Saving meal for userId:", userId);

    const mealToSave = {
      ...meal,
      addedAt: new Date(),
      name: meal.name || "Unnamed Meal",
      category: meal.category || "General",
      rating: meal.rating || 3,
    };

    const plan = await MealPlan.findOneAndUpdate(
      { user: userId },
      { $push: { meals: mealToSave } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("Meal saved successfully:", plan._id);
    return res.status(201).json(plan);
  } catch (err) {
    console.error("🔥 Error saving meal:", err.message);
    console.error(err.stack);
    return res.status(500).json({ error: "Error saving meal: " + err.message });
  }
});

// POST /api/meals/like/:mealId
router.post("/like/:mealId", async (req, res) => {
  try {
    const { mealId } = req.params;
    const { userId } = req.body;
    if (!userId || !mealId) return res.status(400).json({ error: "userId and mealId required" });

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) return res.status(404).json({ error: "Meal plan not found" });

    const mealIndex = plan.meals.findIndex(m => String(m._id) === String(mealId));
    if (mealIndex === -1) return res.status(404).json({ error: "Meal not found in user's plan" });

    plan.meals[mealIndex].isFavorite = true;
    await plan.save();

    return res.json({ message: "Meal liked", meal: plan.meals[mealIndex] });
  } catch (err) {
    console.error("Error liking meal:", err);
    return res.status(500).json({ error: "Error liking meal: " + err.message });
  }
});

// POST /api/meals/rate/:mealId
router.post("/rate/:mealId", async (req, res) => {
  try {
    const { mealId } = req.params;
    const { userId, rating } = req.body;

    if (!userId || !mealId || rating === undefined) {
      return res.status(400).json({ error: "userId, mealId, and rating required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) return res.status(404).json({ error: "Meal plan not found" });

    const mealIndex = plan.meals.findIndex(m => String(m._id) === String(mealId));
    if (mealIndex === -1) return res.status(404).json({ error: "Meal not found" });

    plan.meals[mealIndex].rating = rating;
    await plan.save();

    return res.json({ message: "Meal rated successfully", meal: plan.meals[mealIndex] });

  } catch (err) {
    console.error("Error rating meal:", err);
    return res.status(500).json({ error: "Failed to rate meal: " + err.message });
  }
});

// POST /api/meals/reset-rotation
router.post("/reset-rotation", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    const categories = ["Breakfast", "Lunch", "Snack", "Dinner"];
    for (const cat of categories) {
      const rs = plan.rotationState.find(state => state.category === cat);
      if (rs) {
        rs.lastIndex = -1;
        rs.usedMealIds = [];
      }
    }

    await plan.save();
    return res.json({ message: "Rotation reset successfully" });

  } catch (err) {
    console.error("Error resetting rotation:", err);
    return res.status(500).json({ error: "Failed to reset rotation: " + err.message });
  }
});

// GET /api/meals/saved/:userId
router.get("/saved/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) return res.status(404).json({ error: "No saved meals found" });

    return res.json({ meals: plan.meals });
  } catch (err) {
    console.error("Error fetching saved meals:", err);
    return res.status(500).json({ error: "Error fetching saved meals: " + err.message });
  }
});

// DELETE /api/meals/remove/:mealId/:userId
router.delete("/remove/:mealId/:userId", async (req, res) => {
  try {
    const { mealId, userId } = req.params;

    if (!mealId || !userId) {
      return res.status(400).json({ error: "mealId and userId are required" });
    }

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    const result = await MealPlan.updateOne(
      { user: userId },
      { $pull: { meals: { _id: mealId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Meal not found or already removed" });
    }

    return res.json({ message: "Meal removed successfully" });

  } catch (err) {
    console.error("🔥 REMOVE MEAL ERROR:", err.message);
    return res.status(500).json({ error: "Error removing meal: " + err.message });
  }
});

export default router;