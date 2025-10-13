import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../utils/authContext";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ------------ IMPORTANT: use env var for API base (works locally & prod) -------------
const API_HOST = process.env.REACT_APP_API_BASE || "http://localhost:5001";
// Health endpoints
const HEALTH_API_BASE = `${API_HOST}/api/health-data`;
// (meals API not used here but kept for reference)
// const MEALS_API_BASE = `${API_HOST}/api/meals`;

// ---------- Progress Bar (unchanged) ----------
const ProgressBar = ({ label, current, goal, unit, color = "bg-blue-500" }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1 text-gray-800 font-medium">
        <span>{label}</span>
        <span className="text-gray-900 font-semibold">{Math.round(current)}/{goal} {unit}</span>
      </div>
      <div className="bg-white/30 rounded-full h-3 overflow-hidden backdrop-blur-sm">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-700 mt-1 text-right font-medium">
        {Math.round(percentage)}% of goal
      </div>
    </div>
  );
};

// ---------- Stat Card (unchanged) ----------
const StatCard = ({ title, value, subtitle, icon, color, isBMI = false }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline mt-1">
          <h3 className={`text-2xl font-bold ${isBMI ? 'bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent' : color}`}>
            {value}
          </h3>
        </div>
        <p className="text-xs mt-1 text-gray-600">
          {subtitle}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${color.replace('text', 'bg').replace('600', '100')} ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// ---------- Health Status Card (unchanged) ----------
const HealthStatusCard = ({ bmi, bmiCategory, age, gender }) => {
  const getBMIColor = (category) => {
    switch (category) {
      case 'Underweight': return 'bg-blue-100 text-blue-800';
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Overweight': return 'bg-yellow-100 text-yellow-800';
      case 'Obese': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBMIRecommendation = (category) => {
    switch (category) {
      case 'Underweight': return 'Consider increasing calorie intake with nutrient-dense foods';
      case 'Normal': return 'Great job! Maintain your current healthy lifestyle';
      case 'Overweight': return 'Focus on portion control and regular physical activity';
      case 'Obese': return 'Consult with a healthcare provider for personalized weight management plan';
      default: return 'Complete your profile to get personalized recommendations';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Profile</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-gray-600 font-medium">BMI</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {bmi ? bmi.toFixed(1) : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Category</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBMIColor(bmiCategory)}`}>
            {bmiCategory || 'Not calculated'}
          </span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Age</span>
          <span className="text-gray-900 font-medium">{age || 'N/A'} years</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Gender</span>
          <span className="text-gray-900 font-medium capitalize">{gender || 'N/A'}</span>
        </div>
      </div>
      {bmiCategory && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Recommendation:</span> {getBMIRecommendation(bmiCategory)}
          </p>
        </div>
      )}
    </div>
  );
};

// ---------- Quick Action Card (unchanged) ----------
const QuickActionCard = ({ title, description, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 text-left group hover:border-gray-300 hover:bg-white"
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-xl bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-all duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 ml-4 group-hover:text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm mb-4">{description}</p>
    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300 group-hover:scale-105 shadow-lg">
      <span>Get Started</span>
      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>
  </button>
);

// ---------- Main Dashboard ----------
function Dashboard() {
  // IMPORTANT: include token from auth context if available
  const { user, token } = useAuth(); // <-- token used for Authorization header
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);// eslint-disable-next-line
  const [todayData, setTodayData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState({
    calories: 0, protein: 0, fats: 0, fiber: 0
  });// eslint-disable-next-line
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000, protein: 75, fats: 60, fiber: 25
  });

  // Calculate BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const b = typeof bmi === 'string' ? parseFloat(bmi) : bmi;
    if (isNaN(b)) return null;
    if (b < 18.5) return "Underweight";
    if (b < 25) return "Normal";
    if (b < 30) return "Overweight";
    return "Obese";
  };

  // Calculate age (kept for later use)
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    let birth;
    try {
      birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return null;
    } catch (e) {
      return null;
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  // Calculate active days from weekly health data
  const activeDaysThisWeek = useMemo(() => {
    if (!weeklyData.length) return 0;

    return weeklyData.filter(day => {
      return (day.calories || 0) > 0 ||
        (day.protein || 0) > 0 ||
        (day.fat || 0) > 0 ||
        (day.fiber || 0) > 0;
    }).length;
  }, [weeklyData]);

  // Calculate weekly progress data from health data
  const weeklyProgressData = useMemo(() => {
    if (!weeklyData.length) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weeklyData.map(day => {
      const date = new Date(day.date);
      return {
        day: days[date.getDay()] || day.date,
        calories: day.calories || 0,
        protein: day.protein || 0,
        fats: day.fat || 0,
        fiber: day.fiber || 0,
        meals: day.mealCount || 0
      };
    });
  }, [weeklyData]);

  // Macro distribution
  const macroData = useMemo(() => {
    return [
      { name: 'Protein', value: nutritionData.protein, color: '#3b82f6' },
      { name: 'Fiber', value: nutritionData.fiber, color: '#10b981' },
      { name: 'Fats', value: nutritionData.fats, color: '#f59e0b' },
      { name: 'Calories', value: nutritionData.calories, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [nutritionData]);

  // Nutrition goals helper (unchanged logic)
  const getNutritionGoals = (bmi, age) => {
    let bmiCategory;
    const bmiValue = typeof bmi === 'string' ? parseFloat(bmi) : bmi;
    if (isNaN(bmiValue)) bmiCategory = "normal";
    else if (bmiValue < 18.5) bmiCategory = "underweight";
    else if (bmiValue < 25) bmiCategory = "normal";
    else if (bmiValue < 30) bmiCategory = "overweight";
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

  // Fetch data from multiple sources
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setProfile(null);
      setTodayData(null);
      setWeeklyData([]);
      setSavedMeals([]);
      setNutritionData({ calories: 0, protein: 0, fats: 0, fiber: 0 });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      // common headers
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        // TODAY
        const todayRes = await axios.get(`${HEALTH_API_BASE}/today?userId=${user.id}`, { headers });
        const today = todayRes?.data || {};
        setTodayData(today);

        // WEEKLY
        const weeklyRes = await axios.get(`${HEALTH_API_BASE}/weekly?userId=${user.id}`, { headers });
        const weekly = Array.isArray(weeklyRes?.data) ? weeklyRes.data : [];
        setWeeklyData(weekly);

        // derive savedMeals more robustly:
        // Prefer mealCount from today (if API provides), otherwise infer from today.mealCount or default to 0
        const mealCount = (today && (today.mealCount || 0)) || 0;

        const mockSavedMeals = Array.from({ length: mealCount }).map((_, i) => ({
          _id: `mock-${i}`,
          name: `Meal ${i + 1}`,
          calories: today.calories || 0,
          protein: today.protein || 0,
          fats: today.fat || 0,
          fiber: today.fiber || 0
        }));
        setSavedMeals(mockSavedMeals);

        // Set nutrition data from today's health entry
        const nutritionFromHealth = {
          calories: today.calories || 0,
          protein: today.protein || 0,
          fats: today.fat || 0,
          fiber: today.fiber || 0
        };
        setNutritionData(nutritionFromHealth);

        // Set profile - keep backend user fields but normalize age and bmiCategory
        const calculatedBMICategory = getBMICategory(user.bmi);
        const resolvedAge = user.age || calculateAge(user.birthDate) || null;

        setProfile({
          ...user,
          age: resolvedAge,
          bmiCategory: calculatedBMICategory
        });

        // Set nutrition goals based on profile
        if (user.bmi && (resolvedAge !== null)) {
          const goals = getNutritionGoals(parseFloat(user.bmi), resolvedAge);
          setNutritionGoals(goals);
        } else {
          setNutritionGoals({
            calories: 2000,
            protein: 65,
            fats: 62,
            fiber: 25
          });
        }

      } catch (error) {
        // Improved error logging for Axios
        console.error("Error fetching dashboard data:", error?.message || error);
        console.error("Error details (response):", error?.response?.data || null);
        console.error("Stack:", error?.stack || null);

        // Fallback: attempt to at least fetch today's data (no weekly)
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const todayRes = await axios.get(`${HEALTH_API_BASE}/today?userId=${user.id}`, { headers });
          const today = todayRes?.data || {};
          setTodayData(today);

          const nutritionFromHealth = {
            calories: today.calories || 0,
            protein: today.protein || 0,
            fats: today.fat || 0,
            fiber: today.fiber || 0
          };
          setNutritionData(nutritionFromHealth);

          const hasNutritionData = nutritionFromHealth.calories > 0 || nutritionFromHealth.protein > 0 || nutritionFromHealth.fats > 0 || nutritionFromHealth.fiber > 0;
          setSavedMeals(hasNutritionData ? [{ _id: 'fallback' }] : []);

        } catch (healthError) {
          console.error("Fallback health fetch failed:", healthError?.message || healthError);
          setNutritionData({ calories: 0, protein: 0, fats: 0, fiber: 0 });
          setSavedMeals([]);
        }

        // minimal profile fallback
        setProfile({
          ...user,
          age: user.age || null,
          bmiCategory: getBMICategory(user.bmi)
        });

        setNutritionGoals({
          calories: 2000,
          protein: 65,
          fats: 62,
          fiber: 25
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e1ffd8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#e1ffd8] flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access your dashboard.</p>
          <Link
            to="/login"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition font-semibold shadow-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const bmi = profile?.bmi ? parseFloat(profile.bmi) : null;
  const bmiCategory = profile?.bmiCategory;
  const age = profile?.age;
  const gender = profile?.gender;
  const mealsToday = savedMeals.length;

  const displayGoals = user?.bmi && age ?
    getNutritionGoals(parseFloat(user.bmi), age) :
    { calories: 2000, protein: 65, fats: 62, fiber: 25 };

  return (
    <div className="min-h-screen bg-[#e1ffd8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Welcome back, {profile?.firstName || profile?.name?.split?.(' ')?.[0] || 'User'}! 👋
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            Here's your personalized health and nutrition overview
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Body Mass Index"
            value={bmi ? bmi.toFixed(1) : 'N/A'}
            subtitle={bmiCategory || 'Complete profile'}
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            color="text-blue-600"
            isBMI={true}
          />
          <StatCard
            title="Active Days"
            value={activeDaysThisWeek}
            subtitle="This week"
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            color="text-green-600"
          />
          <StatCard
            title="Meals Today"
            value={mealsToday}
            subtitle="Logged today"
            icon={
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7 2C6.45 2 6 2.45 6 3V10C6 11.66 7.34 13 9 13V22H11V13H13V22H15V13C16.66 13 18 11.66 18 10V3C18 2.45 17.55 2 17 2H7ZM20 2H22V22H20V2Z" />
              </svg>
            }
            color="text-amber-600"
          />
          <StatCard
            title="Calories"
            value={Math.round(nutritionData.calories)}
            subtitle="Today's intake"
            icon={
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C10 6 6 8 6 13C6 17.42 9.58 21 14 21C17.87 21 20 18 20 14C20 9 16 6 12 2ZM12 19C9.79 19 8 17.21 8 15C8 12.79 9.79 11 12 11C14.21 11 16 12.79 16 15C16 17.21 14.21 19 12 19Z" />
              </svg>
            }
            color="text-red-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-1">
            <HealthStatusCard
              bmi={bmi}
              bmiCategory={bmiCategory}
              age={age}
              gender={gender}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 h-full">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Today's Nutrition Progress</h3>
              <div className="space-y-5">
                <ProgressBar
                  label="Calories"
                  current={nutritionData.calories}
                  goal={displayGoals.calories}
                  unit="kcal"
                  color="bg-red-500"
                />
                <ProgressBar
                  label="Protein"
                  current={nutritionData.protein}
                  goal={displayGoals.protein}
                  unit="g"
                  color="bg-blue-500"
                />
                <ProgressBar
                  label="Fats"
                  current={nutritionData.fats}
                  goal={displayGoals.fats}
                  unit="g"
                  color="bg-amber-500"
                />
                <ProgressBar
                  label="Fiber"
                  current={nutritionData.fiber}
                  goal={displayGoals.fiber}
                  unit="g"
                  color="bg-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Weekly Nutrition Progress</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weeklyProgressData} barSize={24} barGap={2}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#4b5563"
                  fontSize={13}
                  fontWeight={600}
                  tickLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '14px'
                  }}
                  formatter={(value, name) => {
                    if (name === 'calories') return [`${value} kcal`, 'Calories'];
                    return [`${value}g`, name.charAt(0).toUpperCase() + name.slice(1)];
                  }}
                  labelStyle={{ fontWeight: '600', color: '#1e293b' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', textAlign: 'center' }}
                  formatter={(value) => {
                    const labels = {
                      calories: 'Calories',
                      protein: 'Protein',
                      fats: 'Fats',
                      fiber: 'Fiber'
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="calories" name="Calories" fill="#f87171" radius={[6, 6, 0, 0]} stackId="a" />
                <Bar dataKey="protein" name="Protein" fill="#60a5fa" radius={[6, 6, 0, 0]} stackId="a" />
                <Bar dataKey="fats" name="Fats" fill="#fbbf24" radius={[6, 6, 0, 0]} stackId="a" />
                <Bar dataKey="fiber" name="Fiber" fill="#34d399" radius={[6, 6, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Today's Nutrition Breakdown</h3>
            {macroData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {macroData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Calories') return [`${Math.round(value)} kcal`, name];
                      return [`${Math.round(value)}g`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '14px'
                    }}
                  />
                  <Legend
                    formatter={(value) => value}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-5xl mb-3">🥗</div>
                <p className="font-medium text-gray-700">No nutrition data yet</p>
                <p className="text-sm text-center mt-1 px-4">
                  Log meals to see your daily nutrition breakdown!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            title="Update Your Profile"
            description="Complete your health profile to get personalized meal recommendations based on your BMI and goals."
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            onClick={() => navigate('/profile')}
            color="blue"
          />
          <QuickActionCard
            title="Plan Your Meals"
            description="Generate personalized meal plans based on your BMI category and nutrition goals. Start eating healthier today!"
            icon={<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10ZM7 14H9V16H7V14ZM11 14H13V16H11V14ZM15 14H17V16H15V14ZM5 2H6V0H8V2H16V0H18V2H19C20.1 2 21 2.9 21 4V22C21 23.1 20.1 24 19 24H5C3.9 24 3 23.1 3 22V4C3 2.9 3.9 2 5 2ZM19 22V8H5V22H19Z"/></svg>}
            onClick={() => navigate('/meals')}
            color="green"
          />
          <QuickActionCard
            title="Track Your Nutrition"
            description="Monitor your daily intake of calories, protein, fats, and fiber. Stay on track with your health goals!"
            icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            onClick={() => navigate('/nutrition-tracking')}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
