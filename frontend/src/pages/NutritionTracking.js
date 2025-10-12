import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../utils/authContext";
import { Link } from "react-router-dom";

// const API_BASE = "http://localhost:5001/api/meals";
const API_BASE = process.env.REACT_APP_API_BASE_URL + "/api/meals";
// Fixed category order
const CATEGORY_ORDER = ["Breakfast", "Lunch", "Snack", "Dinner"];

// Nutrient colors (for backgrounds)
const NUTRIENT_COLORS = {
  calories: "bg-yellow-100",
  protein: "bg-blue-100",
  fats: "bg-amber-100",
  fiber: "bg-green-100"
};

// Nutrient text colors
const NUTRIENT_TEXT_COLORS = {
  calories: "text-yellow-700",
  protein: "text-blue-700",
  fats: "text-amber-700",
  fiber: "text-green-700"
};

function NutritionTracking() {
  const { user } = useAuth();
  const [savedMeals, setSavedMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(null);
  
  // ✅ Get current date in YYYY-MM-DD format for comparison
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const currentDate = getCurrentDate();

  // ✅ Helper function to check if a meal date matches current date
  const isMealFromToday = (mealDate) => {
    if (!mealDate) return false;
    
    // Handle different date formats (ISO string, Date object, etc.)
    const mealDateObj = new Date(mealDate);
    const mealDateString = mealDateObj.toISOString().split('T')[0];
    return mealDateString === currentDate;
  };

  // Nutrition goals
  const getNutritionGoals = (bmi, age) => {
    let bmiCategory;
    if (bmi < 18.5) bmiCategory = "underweight";
    else if (bmi < 25) bmiCategory = "normal";
    else if (bmi < 30) bmiCategory = "overweight";
    else bmiCategory = "obese";

    let ageGroup = "adult";
    if (age >= 12 && age <= 20) ageGroup = "teen";
    else if (age >= 21 && age <= 64) ageGroup = "adult";
    else if (age >= 65) ageGroup = "senior";

    const goals = {
      teen: {
        underweight: { calories: 2800, protein: 90, fiber: 30, fatPercent: 0.30 },
        normal:      { calories: 2400, protein: 75, fiber: 26, fatPercent: 0.28 },
        overweight:  { calories: 2000, protein: 70, fiber: 28, fatPercent: 0.25 },
        obese:       { calories: 1800, protein: 65, fiber: 30, fatPercent: 0.25 }
      },
      adult: {
        underweight: { calories: 2500, protein: 80, fiber: 28, fatPercent: 0.30 },
        normal:      { calories: 2000, protein: 65, fiber: 25, fatPercent: 0.28 },
        overweight:  { calories: 1700, protein: 60, fiber: 28, fatPercent: 0.25 },
        obese:       { calories: 1500, protein: 55, fiber: 30, fatPercent: 0.25 }
      }
    };

    const base = goals[ageGroup]?.[bmiCategory] || goals.adult.normal;
    return {
      calories: base.calories,
      protein: base.protein,
      fiber: base.fiber,
      fats: Math.round((base.fatPercent * base.calories) / 9)
    };
  };

  // ✅ Fetch ALL saved meals and filter by date on frontend
  useEffect(() => {
    if (!user?.id) return;

    const fetchSavedMeals = async () => {
      setLoading(true);
      try {
        // ✅ Fetch all meals without date parameter first
        const res = await axios.get(`${API_BASE}/saved/${user.id}`);
        const allMeals = res.data.meals || [];
        
        // ✅ Filter meals to only include today's meals
        const todayMeals = allMeals.filter(meal => 
          isMealFromToday(meal.addedAt || meal.createdAt || meal.date)
        );
        
        setSavedMeals(todayMeals);
        
        // ✅ Show prompt if no meals for today
        if (todayMeals.length === 0) {
          setError(""); // Clear any previous errors
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch saved meals.");
        setSavedMeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedMeals();// eslint-disable-next-line
  }, [user?.id, currentDate]); // ✅ Include currentDate to refetch when date changes

  const removeMeal = async (mealId) => {
    try {
      await axios.delete(`${API_BASE}/remove/${mealId}/${user.id}`);
      setSavedMeals((prev) => prev.filter((meal) => String(meal._id) !== String(mealId)));
      setShowConfirm(null);
      alert("✅ Meal removed successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to remove meal. Please try again.";
      console.error("Remove error:", errorMsg);
      alert("❌ " + errorMsg);
    }
  };

  // Group meals by category
  const groupedMeals = savedMeals.reduce((acc, meal) => {
    const cat = meal.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(meal);
    return acc;
  }, {});

  // Calculate total nutrients
  const totalNutrients = savedMeals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.fats += meal.fats || 0;
      acc.fiber += meal.fiber || 0;
      return acc;
    },
    { calories: 0, protein: 0, fats: 0, fiber: 0 }
  );

  const goals = user?.bmi && user?.age ? getNutritionGoals(user.bmi, user.age) : null;

  if (!user?.id) return <p className="text-center mt-10 text-lg">Please log in to view your saved meals.</p>;

  return (
    <div className="min-h-screen bg-[#e1ffd8] p-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Nutrition Tracking
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Monitor your daily intake and stay on track with your health goals
          </p>
          {/* ✅ Display current date */}
          <div className="mt-4">
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg shadow-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Add Meals Button + Meal Count */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <Link
            to="/meals"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md whitespace-nowrap font-medium"
          >
             Add More Meals
          </Link>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border">
            <span className="text-sm font-medium text-amber-800">
              {savedMeals.length} meal{savedMeals.length !== 1 ? 's' : ''} logged today
            </span>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        {/* ✅ Show "No meals for today" message when there are no meals */}
        {savedMeals.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md max-w-2xl mx-auto">
            <div className="text-5xl mb-4">🥗</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">No meals logged for today!</h2>
            <p className="text-gray-600 mb-4 px-4">
              It's {new Date().toLocaleDateString('en-US', { weekday: 'long' })}! 
              Start tracking your nutrition by adding meals for today.
            </p>
            <Link
              to="/meals"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
            >
              Add Meals for Today
            </Link>
          </div>
        ) : (
          <>
            {/* Nutrition Breakdown */}
            {goals && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Daily Nutrition Progress</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  {[
                    { label: "Calories", value: totalNutrients.calories, goal: goals.calories, key: "calories", unit: "kcal" },
                    { label: "Protein", value: totalNutrients.protein, goal: goals.protein, key: "protein", unit: "g" },
                    { label: "Fats", value: totalNutrients.fats, goal: goals.fats, key: "fats", unit: "g" },
                    { label: "Fiber", value: totalNutrients.fiber, goal: goals.fiber, key: "fiber", unit: "g" }
                  ].map((nutrient) => {
                    const percent = nutrient.goal > 0 ? Math.min(100, Math.round((nutrient.value / nutrient.goal) * 100)) : 0;
                    const radius = 15;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDasharray = circumference;
                    const strokeDashoffset = circumference - (percent / 100) * circumference;

                    return (
                      <div key={nutrient.label} className="text-center">
                        <div className="relative w-24 h-24 mx-auto">
                          <svg viewBox="0 0 36 36" className="w-full h-full">
                            <circle
                              cx="18"
                              cy="18"
                              r={radius}
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r={radius}
                              fill="none"
                              stroke={`rgb(${{
                                calories: '234 179 8',
                                protein: '59 130 246',
                                fats: '245 158 11',
                                fiber: '34 197 94'
                              }[nutrient.key]})`}
                              strokeWidth="3"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 ease-out"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-800">{percent}%</span>
                          </div>
                        </div>
                        <div className="mt-3 text-sm font-medium text-gray-700">{nutrient.label}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(nutrient.value)}{nutrient.unit} / {nutrient.goal}{nutrient.unit}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ordered Meal Cards */}
            <div className="space-y-8 -mx-4">
              {CATEGORY_ORDER.map((category) => {
                if (!groupedMeals[category] || groupedMeals[category].length === 0) return null;
                
                return (
                  <div key={category}>
                    {/* Category header - BLACK TEXT */}
                    <h2 className="text-2xl font-bold mb-5 px-6 text-gray-800">
                      {category}
                    </h2>
                    <div className="px-4">
                      {groupedMeals[category].map((meal) => (
                        <div
                          key={meal._id}
                          className="rounded-xl p-6 mb-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <h3 className="font-bold text-gray-800 text-xl mb-5">
                            {meal.name}
                          </h3>

                          {/* Nutrient Grid - CENTERED with colored backgrounds */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className={`${NUTRIENT_COLORS.calories} rounded-xl p-4 flex flex-col items-center justify-center`}>
                              <div className="text-xs text-gray-600 font-medium mb-1">Calories</div>
                              <div className={`text-2xl font-bold ${NUTRIENT_TEXT_COLORS.calories}`}>
                                {meal.calories} kcal
                              </div>
                            </div>
                            <div className={`${NUTRIENT_COLORS.protein} rounded-xl p-4 flex flex-col items-center justify-center`}>
                              <div className="text-xs text-gray-600 font-medium mb-1">Protein</div>
                              <div className={`text-2xl font-bold ${NUTRIENT_TEXT_COLORS.protein}`}>
                                {meal.protein}g
                              </div>
                            </div>
                            <div className={`${NUTRIENT_COLORS.fats} rounded-xl p-4 flex flex-col items-center justify-center`}>
                              <div className="text-xs text-gray-600 font-medium mb-1">Fats</div>
                              <div className={`text-2xl font-bold ${NUTRIENT_TEXT_COLORS.fats}`}>
                                {meal.fats}g
                              </div>
                            </div>
                            <div className={`${NUTRIENT_COLORS.fiber} rounded-xl p-4 flex flex-col items-center justify-center`}>
                              <div className="text-xs text-gray-600 font-medium mb-1">Fiber</div>
                              <div className={`text-2xl font-bold ${NUTRIENT_TEXT_COLORS.fiber}`}>
                                {meal.fiber}g
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2">
                            {showConfirm === meal._id ? (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => removeMeal(meal._id)}
                                  className="flex-1 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium transition"
                                >
                                  Confirm Remove
                                </button>
                                <button
                                  onClick={() => setShowConfirm(null)}
                                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 font-medium transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowConfirm(meal._id)}
                                className="w-full py-2.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-200 transition font-medium"
                              >
                                Remove Meal
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Other Meals */}
              {groupedMeals.General && groupedMeals.General.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-5 px-6 text-gray-800">
                    Other Meals
                  </h2>
                  <div className="px-4">
                    {groupedMeals.General.map((meal) => (
                      <div
                        key={meal._id}
                        className="rounded-xl p-6 mb-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <h3 className="font-bold text-gray-800 text-xl mb-5">
                          {meal.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-yellow-100 rounded-xl p-4 flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-600 font-medium mb-1">Calories</div>
                            <div className="text-2xl font-bold text-yellow-700">
                              {meal.calories} kcal
                            </div>
                          </div>
                          <div className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-600 font-medium mb-1">Protein</div>
                            <div className="text-2xl font-bold text-blue-700">
                              {meal.protein}g
                            </div>
                          </div>
                          <div className="bg-amber-100 rounded-xl p-4 flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-600 font-medium mb-1">Fats</div>
                            <div className="text-2xl font-bold text-amber-700">
                              {meal.fats}g
                            </div>
                          </div>
                          <div className="bg-green-100 rounded-xl p-4 flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-600 font-medium mb-1">Fiber</div>
                            <div className="text-2xl font-bold text-green-700">
                              {meal.fiber}g
                            </div>
                          </div>
                        </div>
                        <div className="pt-2">
                          {showConfirm === meal._id ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => removeMeal(meal._id)}
                                className="flex-1 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium transition"
                              >
                                Confirm Remove
                              </button>
                              <button
                                onClick={() => setShowConfirm(null)}
                                className="flex-1 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 font-medium transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowConfirm(meal._id)}
                              className="w-full py-2.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition font-medium"
                            >
                              Remove Meal
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Today's Meal Log Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-10 -mx-1 px-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Meals ({savedMeals.length})</h2>
              {savedMeals.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No meals added today.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pro</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fib</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {savedMeals.map((meal) => (
                        <tr key={meal._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 max-w-xs truncate">{meal.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{meal.category}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(meal.addedAt || meal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{meal.calories}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{meal.protein}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{meal.fats}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{meal.fiber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NutritionTracking;