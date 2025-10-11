// backend/routes/healthDataRoutes.js
import express from 'express';
import HealthData from '../models/healthDataModel.js';
import MealPlan from '../models/mealPlanModel.js';

const router = express.Router();

// Helper: Get start and end of day
const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Helper: Calculate nutrition from meals - FIXED FOR FIBER
const calculateNutritionFromMeals = (meals, dayStart, dayEnd) => {
  const mealsToday = meals.filter(meal => {
    const mealDate = new Date(meal.addedAt || meal.createdAt);
    return mealDate >= dayStart && mealDate <= dayEnd;
  });
  
  const nutrition = mealsToday.reduce((acc, meal) => {
    // Handle different field names for calories
    acc.calories += meal.calories || meal["Calories (kcal)"] || 0;
    // Handle different field names for protein
    acc.protein += meal.protein || meal["Protein (g)"] || 0;
    // Handle different field names for fat
    acc.fat += meal.fats || meal["Fat (g)"] || meal.fat || 0;
    // Handle different field names for fiber - THIS IS THE KEY ADDITION
    acc.fiber += meal.fiber || meal["Fiber (g)"] || 0;
    
    return acc;
  }, { calories: 0, protein: 0, fat: 0, fiber: 0 });
  
  return nutrition;
};

// GET /api/health-data/today - Get today's health data with FIBER
router.get('/today', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    const { start: dayStart, end: dayEnd } = getDayRange(today);

    let healthData = await HealthData.findOne({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd }
    });

    if (!healthData) {
      healthData = new HealthData({
        user: userId,
        date: today
      });
    }

    const mealPlan = await MealPlan.findOne({ user: userId });
    
    if (mealPlan && mealPlan.meals && mealPlan.meals.length > 0) {
      const nutrition = calculateNutritionFromMeals(mealPlan.meals, dayStart, dayEnd);
      
      // Update healthData with real nutrition values - NO CARBS, WITH FIBER
      healthData.calories = nutrition.calories;
      healthData.protein = nutrition.protein;
      healthData.fat = nutrition.fat;
      healthData.fiber = nutrition.fiber;
      
      const mealsToday = mealPlan.meals.filter(meal => {
        const mealDate = new Date(meal.addedAt || meal.createdAt);
        return mealDate >= dayStart && mealDate <= dayEnd;
      });
      
      const mealConsistency = Math.min(100, Math.round((mealsToday.length / 4) * 100));
      healthData.mealConsistency = mealConsistency;
    }

    await healthData.save();
    res.json(healthData);
  } catch (err) {
    console.error('Error fetching today health ', err);
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

// POST /api/health-data/update - Update health data
router.post('/update', async (req, res) => {
  try {
    const { userId, steps, water, sleep, exercise, weight } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    const { start: dayStart, end: dayEnd } = getDayRange(today);

    const updateData = {};
    if (steps !== undefined) updateData.steps = steps;
    if (water !== undefined) updateData.water = water;
    if (sleep !== undefined) updateData.sleep = sleep;
    if (exercise !== undefined) updateData.exercise = exercise;
    if (weight !== undefined) updateData.weight = weight;

    let healthData = await HealthData.findOne({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd }
    });

    if (healthData) {
      Object.assign(healthData, updateData);
    } else {
      healthData = new HealthData({
        user: userId,
        date: today,
        ...updateData
      });
    }

    const mealPlan = await MealPlan.findOne({ user: userId });
    if (mealPlan && mealPlan.meals && mealPlan.meals.length > 0) {
      const nutrition = calculateNutritionFromMeals(mealPlan.meals, dayStart, dayEnd);
      healthData.calories = nutrition.calories;
      healthData.protein = nutrition.protein;
      healthData.fat = nutrition.fat;
      healthData.fiber = nutrition.fiber;
      
      const mealsToday = mealPlan.meals.filter(meal => {
        const mealDate = new Date(meal.addedAt || meal.createdAt);
        return mealDate >= dayStart && mealDate <= dayEnd;
      });
      const mealConsistency = Math.min(100, Math.round((mealsToday.length / 4) * 100));
      healthData.mealConsistency = mealConsistency;
    }

    await healthData.save();
    res.json(healthData);
  } catch (err) {
    console.error('Error updating health ', err);
    res.status(500).json({ error: 'Failed to update health data' });
  }
});

// GET /api/health-data/weekly - Get weekly health data
router.get('/weekly', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const weeklyData = await HealthData.find({
      user: userId,
      date: { $gte: oneWeekAgo }
    })
    .sort({ date: 1 })
    .limit(7);

    const filledData = [];
    const currentDate = new Date(oneWeekAgo);
    
    while (currentDate <= today) {
      const dayData = weeklyData.find(data => {
        const dataDate = new Date(data.date);
        return dataDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayData) {
        filledData.push(dayData);
      } else {
        filledData.push({
          date: new Date(currentDate),
          steps: 0,
          water: 0,
          sleep: 0,
          exercise: 0,
          weight: null,
          calories: 0,
          protein: 0,
          fat: 0,
          fiber: 0, // FIBER instead of carbs
          mealConsistency: 0
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(filledData.slice(-7));
  } catch (err) {
    console.error('Error fetching weekly health ', err);
    res.status(500).json({ error: 'Failed to fetch weekly health data' });
  }
});

// GET /api/health-data/stats - Get health statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const weeklyData = await HealthData.find({
      user: userId,
      date: { $gte: oneWeekAgo }
    });

    if (weeklyData.length === 0) {
      return res.json({
        weeklyGoalCompletion: 0,
        mealConsistency: 0,
        hydrationRate: 0,
        exerciseDays: 0
      });
    }

    const totalSteps = weeklyData.reduce((sum, day) => sum + day.steps, 0);
    const avgSteps = totalSteps / weeklyData.length;
    const weeklyGoalCompletion = Math.min(100, Math.round((avgSteps / 10000) * 100));

    const avgMealConsistency = weeklyData.reduce((sum, day) => sum + day.mealConsistency, 0) / weeklyData.length;
    const mealConsistency = Math.round(avgMealConsistency);

    const totalWater = weeklyData.reduce((sum, day) => sum + day.water, 0);
    const avgWater = totalWater / weeklyData.length;
    const hydrationRate = Math.min(100, Math.round((avgWater / 8) * 100));

    const exerciseDays = weeklyData.filter(day => day.exercise > 0).length;
    const exerciseDaysPercentage = Math.round((exerciseDays / 7) * 100);

    res.json({
      weeklyGoalCompletion,
      mealConsistency,
      hydrationRate,
      exerciseDays: exerciseDaysPercentage
    });
  } catch (err) {
    console.error('Error fetching health stats:', err);
    res.status(500).json({ error: 'Failed to fetch health statistics' });
  }
});

export default router;