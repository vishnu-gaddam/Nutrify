// routes/mealTrackingRoutes.js
import express from "express";
import TrackedMeal from "../models/TrackedMeal.js";

const router = express.Router();

// GET /api/meals/saved/:userId - ✅ This is what your dashboard needs
router.get("/saved/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query; // Optional date filter

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    let query = { userId };

    // Filter by specific date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.addedAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Get all tracked meals for user, sorted by date (newest first)
    const meals = await TrackedMeal.find(query)
      .sort({ addedAt: -1 })
      .lean();

    return res.json({ 
      success: true, 
      meals,
      count: meals.length 
    });

  } catch (err) {
    console.error("Error fetching tracked meals:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while fetching meals" 
    });
  }
});

// POST /api/meals/saved - Add a new tracked meal
router.post("/saved", async (req, res) => {
  try {
    const { 
      userId, 
      name, 
      calories, 
      protein, 
      fats, 
      fiber, 
      carbs = 0, 
      mealType = 'meal',
      addedAt = new Date()
    } = req.body;

    // Validate required fields
    if (!userId || !name || calories === undefined || protein === undefined || 
        fats === undefined || fiber === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const meal = new TrackedMeal({
      userId,
      name,
      calories,
      protein,
      fats,
      fiber,
      carbs,
      mealType,
      addedAt: new Date(addedAt)
    });

    await meal.save();

    return res.status(201).json({ 
      success: true, 
      meal,
      message: 'Meal tracked successfully' 
    });

  } catch (err) {
    console.error("Error saving tracked meal:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid meal data' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while saving meal' 
    });
  }
});

// GET /api/meals/weekly/:userId - Get last 7 days of meals
router.get("/weekly/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7); // Last 7 days

    const meals = await TrackedMeal.find({
      userId,
      addedAt: { $gte: startDate, $lte: endDate }
    }).sort({ addedAt: -1 }).lean();

    return res.json({ 
      success: true, 
      meals,
      count: meals.length 
    });

  } catch (err) {
    console.error("Error fetching weekly tracked meals:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while fetching weekly meals" 
    });
  }
});

// DELETE /api/meals/saved/:mealId - Remove a tracked meal
router.delete("/saved/:mealId", async (req, res) => {
  try {
    const { mealId } = req.params;

    const meal = await TrackedMeal.findByIdAndDelete(mealId);
    if (!meal) {
      return res.status(404).json({ 
        success: false, 
        message: "Meal not found" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Meal deleted successfully" 
    });

  } catch (err) {
    console.error("Error deleting tracked meal:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while deleting meal" 
    });
  }
});

export default router;