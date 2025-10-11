import MealPlan from "../models/mealPlanModel.js";

// @desc Get meal plan for user
// @route GET /api/meals/plan
// @access Private
export const getMealPlan = async (req, res) => {
  try {
    let mealPlan = await MealPlan.findOne({ user: req.user._id });
    if (!mealPlan) {
      mealPlan = await MealPlan.create({ user: req.user._id, meals: [] });
    }
    res.json(mealPlan.meals);
  } catch (error) {
    console.error("Get meal plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update meal plan for user
// @route PUT /api/meals/plan
// @access Private
export const updateMealPlan = async (req, res) => {
  try {
    const { meals } = req.body;
    let mealPlan = await MealPlan.findOne({ user: req.user._id });

    if (!mealPlan) {
      mealPlan = new MealPlan({ user: req.user._id, meals });
    } else {
      mealPlan.meals = meals;
    }

    await mealPlan.save();
    res.json(mealPlan.meals);
  } catch (error) {
    console.error("Update meal plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
