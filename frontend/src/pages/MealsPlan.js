import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../utils/authContext";

// Import your meals database
// import mealsDatabase from "../data/meals_database.json";
//import mealsDatabase from '../../backend/meals_database.json';

const API_BASE = process.env.REACT_APP_API_BASE_URL + "/api/meals";

function MealsPlan() {
  const { user } = useAuth();

  // ✅ Track current date as state (ISO string like "2024-06-15")
  // eslint-disable-next-line 
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [mealsDatabase, setMealsDatabase] = useState([]);

useEffect(() => {
  const fetchMealsDatabase = async () => {
    try {
      const res = await axios.get(`${API_BASE}`);
      setMealsDatabase(res.data);
    } catch (err) {
      console.error("Failed to fetch meals database:", err);
    }
  };
  fetchMealsDatabase();
}, []);


  const [plan, setPlan] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    mealType: "All",
    bmiCategory: "All",
  });

  // ✅ Display date for UI (based on tracked currentDate)
  const currentDateDisplay = new Date(currentDate).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const [addedMeals, setAddedMeals] = useState({}); // category → mealName
  const [savedMealIds, setSavedMealIds] = useState(new Set()); // track saved meal _ids
  const [addedNutrients, setAddedNutrients] = useState({
    calories: 0,
    protein: 0,
    fats: 0,
    fiber: 0,
  });
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000,
    protein: 75,
    fats: 60,
    fiber: 25,
  });

  // ✅ DYNAMIC NUTRITION GOALS BASED ON BMI + AGE
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
      },
      senior: {
        underweight: { calories: 2200, protein: 85, fiber: 28, fatPercent: 0.30 },
        normal:      { calories: 1800, protein: 70, fiber: 25, fatPercent: 0.28 },
        overweight:  { calories: 1500, protein: 65, fiber: 28, fatPercent: 0.25 },
        obese:       { calories: 1300, protein: 60, fiber: 30, fatPercent: 0.25 }
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

  // Set nutrition goals when user data changes
  useEffect(() => {
    if (user?.bmi && user?.age) {
      const goals = getNutritionGoals(user.bmi, user.age);
      setNutritionGoals(goals);
    }
  }, [user?.bmi, user?.age]);

  // ✅ Fetch saved meals for the CURRENT DATE (tracked in state)
  useEffect(() => {
    if (!user?.id) return;

    const fetchSavedMeals = async () => {
      try {
        const res = await axios.get(`${API_BASE}/saved/${user.id}`);
        const allMeals = res.data.meals || [];
        
        // Use the tracked currentDate
        const targetDateStr = currentDate;

        const todayMeals = allMeals.filter(meal => {
          if (!meal.addedAt && !meal.createdAt) return false;
          const mealDateStr = new Date(meal.addedAt || meal.createdAt)
            .toISOString()
            .split('T')[0];
          return mealDateStr === targetDateStr;
        });

        const categoryMap = {};
        const idSet = new Set();
        const nutrients = { calories: 0, protein: 0, fats: 0, fiber: 0 };
        
        todayMeals.forEach(meal => {
          if (meal.category) {
            categoryMap[meal.category] = meal.name;
          }
          if (meal._id) {
            idSet.add(meal._id);
          }
          nutrients.calories += meal.calories || 0;
          nutrients.protein += meal.protein || 0;
          nutrients.fats += meal.fats || 0;
          nutrients.fiber += meal.fiber || 0;
        });
        
        setAddedMeals(categoryMap);
        setSavedMealIds(idSet);
        setAddedNutrients(nutrients);
        
      } catch (err) {
        console.error("Failed to fetch saved meals:", err);
        setAddedMeals({});
        setSavedMealIds(new Set());
        setAddedNutrients({ calories: 0, protein: 0, fats: 0, fiber: 0 });
      }
    };

    fetchSavedMeals();
  }, [user?.id, currentDate]);

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  // ✅ SMART MEAL PLAN GENERATION USING YOUR DATABASE
  const generateMealPlan = async () => {
    if (!user?.bmi || !user?.age || !user?.id) {
      setError("Please complete your profile (BMI and age) to generate a meal plan.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Get user category
      const bmiCategory = user.bmi < 18.5 ? "Underweight" : 
                         user.bmi < 25 ? "Normal" : 
                         user.bmi < 30 ? "Overweight" : "Obese";
      
      const ageRanges = [
        { min: 12, max: 20, label: "12–20" },
        { min: 21, max: 30, label: "21–30" },
        { min: 31, max: 40, label: "31–40" },
        { min: 41, max: 50, label: "41–50" },
        { min: 51, max: 60, label: "51–60" },
        { min: 61, max: 120, label: "60+" }
      ];
      
      const ageGroup = ageRanges.find(range => 
        user.age >= range.min && user.age <= range.max
      )?.label || "21–30";

      // Filter meals for user profile
      if (mealsDatabase.length === 0) {
  alert("Meals data is still loading. Please wait a moment.");
  return;
}

const filteredMeals = mealsDatabase.filter(meal =>
  meal["Age Group"] === ageGroup &&
  meal["BMI Category"].includes(bmiCategory)
);


      // Group by meal type
      const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];
      const newPlan = {};

      mealTypes.forEach(mealType => {
        const mealsForType = filteredMeals.filter(meal => meal["Meal Type"] === mealType);
        if (mealsForType.length > 0) {
          // Select 2 diverse options per category
          const shuffled = [...mealsForType].sort(() => 0.5 - Math.random());
          newPlan[mealType] = shuffled.slice(0, 2);
        }
      });

      setPlan(newPlan);
      
      // Optional: Save to backend for analytics
      await axios.post(`${API_BASE}/plan`, {
        userId: user.id,
        plan: newPlan,
        date: currentDate,
        bmi: user.bmi,
        age: user.age
      });
      
    } catch (err) {
      console.error("Generate meal plan error:", err);
      setError("Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (meal, category) => {
    if (!user?.id) return alert("Login required to save meals.");

    if (addedMeals[category]) {
      alert(
        `You've already selected a meal for "${category}".\n\n` +
        `To choose a different meal, please first remove your current "${category}" meal in the "Nutrition Tracking" section.`
      );
      return;
    }

    const mappedMeal = {
      name: meal.Dish || "Unnamed Meal",
      category: meal["Meal Type"] || category || "General",
      calories: meal["Calories (kcal)"] ?? 0,
      protein: meal["Protein (g)"] ?? 0,
      fats: meal["Fat (g)"] ?? 0,
      carbs: meal["Carbs (g)"] ?? 0,
      fiber: meal["Fiber (g)"] ?? 0,
      ingredients: meal["Ingredients"] || "",
      notes: meal["Notes"] || "",
      isFavorite: false,
      addedByUser: true,
      image: "/images/default.jpg",
    };

    try {
      const response = await axios.post(`${API_BASE}/save`, {
        userId: user.id,
        meal: mappedMeal,
        date: currentDate,
      });

      if (response.status === 200 || response.status === 201) {
        const savedMeals = response.data.meals;
        const newMeal = savedMeals[savedMeals.length - 1];

        setAddedMeals(prev => ({
          ...prev,
          [category]: mappedMeal.name,
        }));
        setSavedMealIds(prev => new Set([...prev, newMeal._id]));

        setAddedNutrients(prev => ({
          calories: prev.calories + (mappedMeal.calories || 0),
          protein: prev.protein + (mappedMeal.protein || 0),
          fats: prev.fats + (mappedMeal.fats || 0),
          fiber: prev.fiber + (mappedMeal.fiber || 0),
        }));

        alert(`${mappedMeal.name} added to your ${category} plan for today.`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to add meal. Please try again.";
      console.error("Error adding meal:", errorMsg);
      alert(`❌ ${errorMsg}`);
    }
  };

  const stripEmoji = (str) =>
    str?.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu, "").trim().toLowerCase() || "";

  const filteredPlan = Object.keys(plan).reduce((acc, category) => {
    if (!plan[category]) return acc;

    let filteredMeals = plan[category];

    if (filters.mealType !== "All") {
      filteredMeals = filteredMeals.filter(
        (meal) => (meal["Meal Type"] || "").toLowerCase() === filters.mealType.toLowerCase()
      );
    }

    if (filters.bmiCategory !== "All") {
      filteredMeals = filteredMeals.filter(
        (meal) => stripEmoji(meal["BMI Category"]) === filters.bmiCategory.toLowerCase()
      );
    }

    filteredMeals = filteredMeals.filter(meal => {
      if (meal._id && savedMealIds.has(meal._id)) return false;
      return true;
    });

    if (filteredMeals.length > 0) {
      acc[category] = filteredMeals.slice(0, 2);
    }

    return acc;
  }, {});

  // ---------------------- BMI Gauge Component ----------------------
  const BMICircularGauge = ({ bmi }) => {
    const ranges = [
      { label: "Underweight", min: 0, max: 18.5, color: "#3B82F6", angleStart: 90, angleEnd: 162 },
      { label: "Normal", min: 18.5, max: 24.9, color: "#10B981", angleStart: 162, angleEnd: 234 },
      { label: "Overweight", min: 24.9, max: 29.9, color: "#F59E0B", angleStart: 234, angleEnd: 306 },
      { label: "Obese", min: 29.9, max: 35, color: "#EF4444", angleStart: 306, angleEnd: 378 },
      { label: "Extremely Obese", min: 35, max: 50, color: "#DC2626", angleStart: 378, angleEnd: 450 },
    ];

    const activeRange = ranges.find(r => bmi >= r.min && bmi < r.max) || ranges[ranges.length - 1];
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => setIsLoaded(true), []);

    const getNeedleAngle = () => {
      const clamped = Math.min(Math.max(bmi, 0), 50);
      const range = ranges.find(r => clamped >= r.min && clamped < r.max) || ranges[ranges.length - 1];
      const fraction = (clamped - range.min) / (range.max - range.min);
      return range.angleStart + fraction * (range.angleEnd - range.angleStart);
    };

    const needleAngle = getNeedleAngle();
    const rad = (needleAngle * Math.PI) / 180;
    const needleLength = 65;
    const tipX = 100 + needleLength * Math.cos(rad);
    const tipY = 100 + needleLength * Math.sin(rad);
    const baseLeftX = 100 + 4 * Math.cos(rad + Math.PI / 2);
    const baseLeftY = 100 + 4 * Math.sin(rad + Math.PI / 2);
    const baseRightX = 100 + 4 * Math.cos(rad - Math.PI / 2);
    const baseRightY = 100 + 4 * Math.sin(rad - Math.PI / 2);

    const getSegmentCenter = (range) => {
      const midAngle = (range.angleStart + range.angleEnd) / 2;
      const rad = (midAngle * Math.PI) / 180;
      const radius = 55;
      return { x: 100 + radius * Math.cos(rad), y: 100 + radius * Math.sin(rad) };
    };

    return (
      <div className="flex flex-col items-center space-y-6 ">
        <div className="relative w-56 h-56">
          <svg width="260" height="260" viewBox="15 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="10" />
            {ranges.map((range, idx) => {
              const startRad = (range.angleStart * Math.PI) / 180;
              const endRad = (range.angleEnd * Math.PI) / 180;
              const startX = 100 + 80 * Math.cos(startRad);
              const startY = 100 + 80 * Math.sin(startRad);
              const endX = 100 + 80 * Math.cos(endRad);
              const endY = 100 + 80 * Math.sin(endRad);
              const largeArc = range.angleEnd - range.angleStart > 180 ? 1 : 0;
              const isActive = activeRange.label === range.label;
              return (
                <path
                  key={idx}
                  d={`M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY} Z`}
                  fill={range.color}
                  stroke={isActive ? "#000" : "none"}
                  strokeWidth={isActive ? 2 : 0}
                />
              );
            })}
            <polygon
              points={`${baseLeftX},${baseLeftY} ${baseRightX},${baseRightY} ${tipX},${tipY}`}
              fill="#000000"
              className={`transition-all duration-1000 ease-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
            />
            <circle cx="100" cy="100" r="5" fill="#1F2937" stroke="#111111" strokeWidth="2" />
            {ranges.map((range, idx) => {
              const center = getSegmentCenter(range);
              return (
                <g key={idx}>
                  <text x={center.x + 3} y={center.y - 8} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="bold" fill="white">
                    {range.label}
                  </text>
                  <text x={center.x} y={center.y + 7} textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="8" fill="white">
                    {range.min === 0 ? "<18.5" : `${range.min}-${range.max}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-2xl font-bold text-gray-800">{bmi.toFixed(1)}</span>
          <span className="px-4 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: activeRange.color, color: "white" }}>
            {activeRange.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#e1ffd8] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Meals Planner</h1>
          <div className="flex gap-3 items-center">
            {/* ✅ Date display beside the button */}
            <span className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm">
              {currentDateDisplay}
            </span>
            <button
              onClick={generateMealPlan}
              className={`px-6 py-2 rounded-lg text-white font-semibold transition ${
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Meal Plan"}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold text-gray-800 mb-1 text-center">Your BMI</h3>
              {user?.bmi ? (
                <BMICircularGauge bmi={parseFloat(user.bmi)} />
              ) : (
                <p className="text-sm text-amber-600 italic mb-3 text-center">⚠️ BMI not available.</p>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="font-semibold mb-3">Filters</h2>
              <label className="block text-sm mb-1">Meal Type</label>
              <select
                name="mealType"
                value={filters.mealType}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded mb-3"
              >
                <option value="All">All Meals</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snack">Snack</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>

            {/* ✅ DYNAMIC NUTRITION SUMMARY CARD */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="font-semibold mb-3 text-center">Daily Nutrition Progress</h2>
              
              {user?.bmi && user?.age ? (
                <>
                  {/* Calories */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Calories</span>
                      <span>
                        {Math.round(addedNutrients.calories)} / {nutritionGoals.calories} kcal (
                        {Math.min(100, Math.round((addedNutrients.calories / nutritionGoals.calories) * 100))}%
                        )
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (addedNutrients.calories / nutritionGoals.calories) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Protein */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Protein</span>
                      <span>
                        {Math.round(addedNutrients.protein)}g / {nutritionGoals.protein}g (
                        {Math.min(100, Math.round((addedNutrients.protein / nutritionGoals.protein) * 100))}%
                        )
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (addedNutrients.protein / nutritionGoals.protein) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Fats */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fats</span>
                      <span>
                        {Math.round(addedNutrients.fats)}g / {nutritionGoals.fats}g (
                        {Math.min(100, Math.round((addedNutrients.fats / nutritionGoals.fats) * 100))}%
                        )
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (addedNutrients.fats / nutritionGoals.fats) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Fiber */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fiber</span>
                      <span>
                        {Math.round(addedNutrients.fiber)}g / {nutritionGoals.fiber}g (
                        {Math.min(100, Math.round((addedNutrients.fiber / nutritionGoals.fiber) * 100))}%
                        )
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (addedNutrients.fiber / nutritionGoals.fiber) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Complete your profile to see personalized nutrition goals.
                </p>
              )}
            </div>
          </div>

          {/* Meal Plan */}
          <div className="flex-1 space-y-6">
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {Object.keys(filteredPlan).length > 0 && (
              <h2 className="text-2xl font-bold text-center mb-4 text-black">
                Your Recommended Meals for Today – Select One Meal From Each Category
              </h2>
            )}
            {Object.keys(filteredPlan).length > 0 ? (
              Object.keys(filteredPlan).map((category) => (
                <div key={category}>
                  <h2 className="text-3xl font-semibold mb-4 border-b pb-2">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPlan[category].map((meal, idx) => (
                      <div
                        key={meal._id || `${category}-${idx}`}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-all"
                      >
                        <div
                          className={`p-4 text-black font-bold flex flex-col justify-center rounded-lg min-h-[100px] ${
                            meal["Meal Type"] === "Breakfast"
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                              : meal["Meal Type"] === "Lunch"
                              ? "bg-gradient-to-r from-green-400 to-green-500"
                              : meal["Meal Type"] === "Dinner"
                              ? "bg-gradient-to-r from-purple-400 to-purple-500"
                              : meal["Meal Type"] === "Snack"
                              ? "bg-gradient-to-r from-blue-400 to-blue-500"
                              : "bg-gray-500"
                          }`}
                        >
                          <div className="w-full text-left">
                            <h3 className="text-base font-bold leading-tight break-words">
                              {meal.Dish}
                            </h3>
                            <p className="text-xs md:text-sm font-medium mt-1 opacity-90">
                              {meal["Meal Type"]}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-around p-4 border-b border-gray-100">
                          <div className="text-center">
                            <span className="font-bold text-yellow-600">
                              {meal["Calories (kcal)"] ?? 0}
                            </span>
                            <p className="text-xs text-gray-500">Calories</p>
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-blue-600">
                              {meal["Protein (g)"] ?? 0}g
                            </span>
                            <p className="text-xs text-gray-500">Protein</p>
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-yellow-600">
                              {meal["Fat (g)"] ?? 0}g
                            </span>
                            <p className="text-xs text-gray-500">Fats</p>
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-green-600">
                              {meal["Fiber (g)"] ?? 0}g
                            </span>
                            <p className="text-xs text-gray-500">Fiber</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-4 text-base text-gray-800 flex-1 overflow-y-auto">
                          <div>
                            <p className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                              <span>⚖️</span> Portion: {meal["Serving Size"] || "-"}
                            </p>
                          </div>
                          <div>
                            <strong className="block mb-1 text-gray-900 text-base">Ingredients:</strong>
                            {meal["Ingredients"] ? (
                              <ul className="list-disc list-inside ml-4 space-y-1">
                                {meal["Ingredients"]
                                  .split(",")
                                  .slice(0, 6)
                                  .map((i, idx) => (
                                    <li key={idx} className="text-gray-700 text-sm">
                                      {i.trim()}
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-sm italic">No ingredients listed.</p>
                            )}
                          </div>
                        </div>

                        {meal["Notes"] && (
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                            <p className="text-gray-700 text-sm leading-relaxed">
                              <strong className="text-gray-900 font-semibold">Notes:</strong>{" "}
                              {meal["Notes"]}
                            </p>
                          </div>
                        )}

                        <div className="p-4 flex items-center justify-between border-t border-gray-100">
                          <button
                            onClick={() => {
                              if (addedMeals[category]) {
                                alert(
                                  `You've already selected a meal for "${category}".\n\n` +
                                  `To choose a different meal, please first remove your current "${category}" meal in the "Nutrition Tracking" section.`
                                );
                                return;
                              }
                              addMeal(meal, category);
                            }}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                              addedMeals[category]
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {addedMeals[category] === meal.Dish ? "Added ✓" : "Add +"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : !loading ? (
              <div className="text-center py-16 text-gray-500">
                Select filters and click "Generate Meal Plan" for today.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MealsPlan;