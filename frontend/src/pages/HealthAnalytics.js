// src/pages/HealthAnalytics.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../utils/authContext";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

//const API_BASE = "http://localhost:5001/api/health-data";
const API_BASE = process.env.REACT_APP_API_BASE_URL + "/api/health-data";

const HealthAnalytics = () => {
  const { user } = useAuth();
  const [dailyLog, setDailyLog] = useState({
    steps: "",
    water: "",
    sleep: "",
    exercise: "",
    weight: ""
  });
  const [todayData, setTodayData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [lastWeekData, setLastWeekData] = useState([]);
  const [healthStats, setHealthStats] = useState({
    weeklyGoalCompletion: 0,
    mealConsistency: 0,
    hydrationRate: 0,
    exerciseDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // eslint-disable-next-line
  const [showDateChangePrompt, setShowDateChangePrompt] = useState(false);

  // Fetch today's data
  const fetchTodayData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/today?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch today data');
      const data = await response.json();
      setTodayData(data);
      
      // Check if today's data is complete (has nutrition values)
      if (data.calories === 0 && data.protein === 0 && data.fat === 0 && data.fiber === 0) {
        setShowDateChangePrompt(true);
      }
      
      setDailyLog({
        steps: data.steps || "",
        water: data.water || "",
        sleep: data.sleep || "",
        exercise: data.exercise || "",
        weight: data.weight || ""
      });
    } catch (err) {
      console.error('Error fetching today data:', err);
      setError('Failed to load today data');
    }
  };

  // Fetch weekly data
  const fetchWeeklyData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/weekly?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch weekly data');
      const data = await response.json();
      setWeeklyData(data);
    } catch (err) {
      console.error('Error fetching weekly data:', err);
      setError('Failed to load weekly data');
    }
  };

  // Fetch last week's data for comparison
  const fetchLastWeekData = async () => {
    if (!user?.id) return;
    
    try {
      // Get last week's date range
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      const twoWeeksAgo = new Date(oneWeekAgo);
      twoWeeksAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const response = await fetch(`${API_BASE}/weekly?userId=${user.id}&startDate=${twoWeeksAgo.toISOString()}&endDate=${oneWeekAgo.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch last week data');
      const data = await response.json();
      setLastWeekData(data);
    } catch (err) {
      console.error('Error fetching last week data:', err);
      // Don't set error for this - it's optional for comparison
    }
  };

  const fetchHealthStats = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/stats?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch health stats');
      const stats = await response.json();
      setHealthStats(stats);
    } catch (err) {
      console.error('Error fetching health stats:', err);
      setError('Failed to load health statistics');
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      setError("");
      await Promise.all([
        fetchTodayData(),
        fetchWeeklyData(),
        fetchLastWeekData(),
        fetchHealthStats()
      ]);
      setLoading(false);
    };
    
    loadData();// eslint-disable-next-line
  }, [user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDailyLog(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    
    try {
      const updateData = {
        userId: user.id,
        steps: dailyLog.steps ? parseInt(dailyLog.steps) : undefined,
        water: dailyLog.water ? parseInt(dailyLog.water) : undefined,
        sleep: dailyLog.sleep ? parseFloat(dailyLog.sleep) : undefined,
        exercise: dailyLog.exercise ? parseInt(dailyLog.exercise) : undefined,
        weight: dailyLog.weight ? parseFloat(dailyLog.weight) : undefined
      };

      const response = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update health data');
      
      await Promise.all([
        fetchTodayData(),
        fetchWeeklyData(),
        fetchLastWeekData(),
        fetchHealthStats()
      ]);
      
      alert("Daily log updated successfully!✅");
      setShowDateChangePrompt(false); // Hide prompt after submission
    } catch (err) {
      console.error('Error updating health ', err);
      alert("Failed to update daily log. Please try again.");
    }
  };

  // Get REAL nutrition data - FIBER instead of carbs
  const nutrition = {
    calories: todayData?.calories || 0,
    protein: todayData?.protein || 0,
    fat: todayData?.fat || 0,
    fiber: todayData?.fiber || 0
  };

  // Calculate metrics for comparison
  const calculateComparison = () => {
    if (!weeklyData.length || !lastWeekData.length) return null;
    
    // Calculate averages for this week and last week
    const thisWeek = weeklyData.reduce((acc, day) => {
      acc.steps += day.steps || 0;
      acc.water += day.water || 0;
      acc.sleep += day.sleep || 0;
      acc.exercise += day.exercise || 0;
      acc.calories += day.calories || 0;
      acc.protein += day.protein || 0;
      acc.fat += day.fat || 0;
      acc.fiber += day.fiber || 0;
      return acc;
    }, { steps: 0, water: 0, sleep: 0, exercise: 0, calories: 0, protein: 0, fat: 0, fiber: 0 });
    
    const lastWeek = lastWeekData.reduce((acc, day) => {
      acc.steps += day.steps || 0;
      acc.water += day.water || 0;
      acc.sleep += day.sleep || 0;
      acc.exercise += day.exercise || 0;
      acc.calories += day.calories || 0;
      acc.protein += day.protein || 0;
      acc.fat += day.fat || 0;
      acc.fiber += day.fiber || 0;
      return acc;
    }, { steps: 0, water: 0, sleep: 0, exercise: 0, calories: 0, protein: 0, fat: 0, fiber: 0 });
    
    // Calculate averages
    const thisWeekAvg = {
      steps: Math.round(thisWeek.steps / 7),
      water: Math.round(thisWeek.water / 7),
      sleep: parseFloat((thisWeek.sleep / 7).toFixed(1)),
      exercise: Math.round(thisWeek.exercise / 7),
      calories: Math.round(thisWeek.calories / 7),
      protein: Math.round(thisWeek.protein / 7),
      fat: Math.round(thisWeek.fat / 7),
      fiber: Math.round(thisWeek.fiber / 7)
    };
    
    const lastWeekAvg = {
      steps: Math.round(lastWeek.steps / 7),
      water: Math.round(lastWeek.water / 7),
      sleep: parseFloat((lastWeek.sleep / 7).toFixed(1)),
      exercise: Math.round(lastWeek.exercise / 7),
      calories: Math.round(lastWeek.calories / 7),
      protein: Math.round(lastWeek.protein / 7),
      fat: Math.round(lastWeek.fat / 7),
      fiber: Math.round(lastWeek.fiber / 7)
    };
    
    // Calculate percentage changes
    const getPercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    return {
      calories: {
        change: getPercentageChange(thisWeekAvg.calories, lastWeekAvg.calories),
        current: thisWeekAvg.calories,
        previous: lastWeekAvg.calories
      },
      steps: {
        change: getPercentageChange(thisWeekAvg.steps, lastWeekAvg.steps),
        current: thisWeekAvg.steps,
        previous: lastWeekAvg.steps
      },
      water: {
        change: getPercentageChange(thisWeekAvg.water, lastWeekAvg.water),
        current: thisWeekAvg.water,
        previous: lastWeekAvg.water
      },
      sleep: {
        change: getPercentageChange(thisWeekAvg.sleep, lastWeekAvg.sleep),
        current: thisWeekAvg.sleep,
        previous: lastWeekAvg.sleep
      }
    };
  };

  const comparison = calculateComparison();

  // Generate AI Health Insights
  const getAIInsights = () => {
    if (!comparison) return "Loading insights...";
    
    const insights = [];
    
    if (comparison.steps.change >= 10) {
      insights.push(`Great job on increasing your physical activity this week! Your step count is up by ${comparison.steps.change}%.`);
    } else if (comparison.steps.change <= -10) {
      insights.push(`Your step count is down by ${Math.abs(comparison.steps.change)}% this week. Try to get moving more!`);
    }
    
    if (comparison.water.change <= -5) {
      insights.push(`Try to maintain better hydration - aim for at least 8 glasses of water daily.`);
    } else if (comparison.water.change >= 5) {
      insights.push(`Excellent hydration this week! Keep drinking plenty of water.`);
    }
    
    if (comparison.sleep.change >= 5) {
      insights.push(`You're getting better rest this week - keep it up!`);
    } else if (comparison.sleep.change <= -5) {
      insights.push(`Try to improve your sleep quality - aim for 7+ hours nightly.`);
    }
    
    if (comparison.calories.change >= 10) {
      insights.push(`Your calorie intake is higher this week. Consider adjusting your meals if you're trying to lose weight.`);
    } else if (comparison.calories.change <= -10) {
      insights.push(`Your calorie intake is lower this week. Make sure you're getting enough nutrients.`);
    }
    
    if (insights.length === 0) {
      insights.push(`You're maintaining good consistency in your health habits. Keep going!`);
    }
    
    return insights.join(" ");
  };

  const aiInsights = getAIInsights();

  // Chart data preparation
// Hydration Pie / Bar Chart Data
const hydrationChartData = {
  labels: weeklyData.map(day => 
    new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
  ),
  datasets: [
    {
      label: 'Daily Water Intake (glasses)',
      data: weeklyData.map(day => day.water || 0),
      backgroundColor: '#34D399',
      borderColor: '#10B981',
      borderWidth: 1
    }
  ]
};

const activityChartData = {
  labels: ['Steps', 'Exercise'],
  datasets: [
    {
      label: 'This Week',
      data: [comparison?.steps.current || 0, weeklyData.reduce((acc, d) => acc + (d.exercise || 0), 0) / (weeklyData.length || 1)],
      backgroundColor: ['#60A5FA', '#34D399']
    }
  ]
};

const nutritionChartData = {
  labels: ['Calories', 'Protein', 'Fat', 'Fiber'],
  datasets: [
    {
      label: 'Nutrition',
      data: [nutrition.calories, nutrition.protein, nutrition.fat, nutrition.fiber],
      backgroundColor: ['#F59E0B', '#3B82F6', '#EF4444', '#10B981']
    }
  ]
};

// Define your quotes
const quotes = {
  hydration: [
    "Water is life’s matter and matrix, mother and medium. – Albert Szent-Györgyi",
    "Thousands have lived without love, not one without water. – W. H. Auden",
    "Drinking water is the easiest way to stay healthy."
  ],
  nutrition: [
    "Let food be thy medicine and medicine be thy food. – Hippocrates",
    "Your diet is a bank account. Good food choices are good investments. – Bethenny Frankel",
    "Every time you eat is an opportunity to nourish your body."
  ],
  exercise: [
    "Take care of your body. It’s the only place you have to live. – Jim Rohn",
    "The only bad workout is the one that didn’t happen.",
    "A little progress each day adds up to big results."
  ],
  sleep: [
    "Sleep is the best meditation. – Dalai Lama",
    "Your future depends on your dreams, so go to sleep.",
    "Sleep is the golden chain that ties health and our bodies together. – Thomas Dekker"
  ]
};

const [quote, setQuote] = useState("Loading health tips...");

const updateQuote = () => {
  if (!comparison || !todayData) {
    setQuote("Loading health tips...");
    return;
  }

  const quotesList = [];

  if (healthStats.hydrationRate < 70) {
    quotesList.push(quotes.hydration[Math.floor(Math.random() * quotes.hydration.length)]);
  }

  if ((comparison?.steps.current || 0) < 5000) {
    quotesList.push(quotes.exercise[Math.floor(Math.random() * quotes.exercise.length)]);
  }

  if ((nutrition.protein || 0) < 50) {
    quotesList.push(quotes.nutrition[Math.floor(Math.random() * quotes.nutrition.length)]);
  }

  if ((comparison?.sleep.current || 0) < 7) {
    quotesList.push(quotes.sleep[Math.floor(Math.random() * quotes.sleep.length)]);
  }

  if (quotesList.length === 0) {
    setQuote("Stay consistent, small steps build big changes!");
  } else {
    setQuote(quotesList[Math.floor(Math.random() * quotesList.length)]);
  }
};

// Call updateQuote whenever these dependencies change
useEffect(() => {
  updateQuote();
},
// eslint-disable-next-line
 [dailyLog, comparison, healthStats, todayData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#e0fecb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#e2fbc4] flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e1ffd8] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Health Analytics</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Track your progress, set goals, and achieve optimal health with personalized insights
          </p>
        
        </div>

        {/* Nutrition Card - MATCHING REFERENCE IMAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Nutrition Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-gray-800">Nutrition</h2>
              
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{nutrition.calories}</div>
                <div className="text-xs text-gray-600">Calories</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{nutrition.protein}g</div>
                <div className="text-xs text-gray-600">Protein</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{nutrition.fat}g</div>
                <div className="text-xs text-gray-600">Fats</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{nutrition.fiber}g</div>
                <div className="text-xs text-gray-600">Fiber</div>
              </div>
            </div>
          </div>

          {/* Hydration Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-gray-800">Hydration</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{todayData?.water || 0}</div>
                <div className="text-xs text-gray-600">Glasses</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{((todayData?.water || 0) * 0.25).toFixed(1)}L</div>
                <div className="text-xs text-gray-600">Total Water</div>
              </div>
            </div>
            
            {/* Today's Hydration Goal - based on today's actual intake */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Today's Hydration Goal</span>
                <span>{todayData?.water ? Math.min(100, Math.round((todayData.water / 8) * 100)) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-500" 
                  style={{ width: `${todayData?.water ? Math.min(100, Math.round((todayData.water / 8) * 100)) : 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Weekly Hydration Rate - keep this separate */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Weekly Hydration Rate</span>
                <span>{healthStats.hydrationRate || 0}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on {weeklyData.length} days this week
              </div>
            </div>
          </div>

        {/* Sleep Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-gray-800">Sleep</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{todayData?.sleep || 0}h</div>
                <div className="text-xs text-gray-600">Last Night</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {todayData?.sleep ? Math.min(100, Math.round((todayData.sleep / 8) * 100)) : 0}%
                </div>
                <div className="text-xs text-gray-600">Quality</div>
              </div>
            </div>
            
            {/* Today's Sleep Goal Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Sleep Goal (7h)</span>
                <span>{todayData?.sleep ? Math.min(100, Math.round((todayData.sleep / 7) * 100)) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500" 
                  style={{ width: `${todayData?.sleep ? Math.min(100, Math.round((todayData.sleep / 7) * 100)) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

       {/* Activity Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-gray-800">Activity</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{todayData?.steps || 0}</div>
                <div className="text-xs text-gray-600">Steps</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{todayData?.exercise || 0}min</div>
                <div className="text-xs text-gray-600">Exercise</div>
              </div>
            </div>
            
            {/* Today's Activity Goal Progress */}
            <div className="mt-6">
              {todayData ? (
                <>
                  {/* Calculate today's activity progress */}
                  {(() => {
                    const stepsProgress = todayData.steps ? Math.min(100, Math.round((todayData.steps / 10000) * 100)) : 0;
                    const exerciseProgress = todayData.exercise ? Math.min(100, Math.round((todayData.exercise / 30) * 100)) : 0;
                    const avgProgress = Math.round((stepsProgress + exerciseProgress) / 2);
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm text-gray-700 mb-1">
                          <span>Activity Goal</span>
                          <span>{avgProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-indigo-500" 
                            style={{ width: `${avgProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Based on 10k steps & 30min exercise
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>Activity Goal</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: '0%' }}></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Data Visualization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Nutrition Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Nutrition Distribution</h3>
            <div className="h-64">
              <Pie data={nutritionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Hydration Progress */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Weekly Hydration Trend</h3>
            <div className="h-64">
              <Bar 
                data={hydrationChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Glasses of Water'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Days of Week'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Activity Comparison */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Activity Comparison</h3>
            <div className="h-64">
              <Bar data={activityChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Health Comparison Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Health Comparison</h2>
          <p className="text-lg text-gray-600 mb-4">This Week vs Last Week</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparison && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-800 font-medium">Calories</span>
                    <span className={`text-sm font-bold ${comparison.calories.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.calories.change >= 0 ? '+' : ''}{comparison.calories.change}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparison.calories.change >= 0 ? 'Better consistency' : 'Need improvement'}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-800 font-medium">Steps</span>
                    <span className={`text-sm font-bold ${comparison.steps.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.steps.change >= 0 ? '+' : ''}{comparison.steps.change}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparison.steps.change >= 0 ? 'More active' : 'Less active'}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-800 font-medium">Water</span>
                    <span className={`text-sm font-bold ${comparison.water.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.water.change >= 0 ? '+' : ''}{comparison.water.change}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparison.water.change >= 0 ? 'Good hydration' : 'Drink more water'}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-800 font-medium">Sleep</span>
                    <span className={`text-sm font-bold ${comparison.sleep.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.sleep.change >= 0 ? '+' : ''}{comparison.sleep.change}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparison.sleep.change >= 0 ? 'Better rest' : 'Need more rest'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Health Insights */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Health Insights</h2>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-800">{aiInsights}</p>
          </div>
        </div>

        {/* Daily Log Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Activity Log</h2>
          <p className="text-gray-600 mb-6">Track your daily health metrics to stay on top of your wellness goals</p>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
              <input
                type="number"
                name="steps"
                value={dailyLog.steps}
                onChange={handleInputChange}
                placeholder="e.g. 8500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water (glasses)</label>
              <input
                type="number"
                name="water"
                value={dailyLog.water}
                onChange={handleInputChange}
                placeholder="e.g. 8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                name="sleep"
                value={dailyLog.sleep}
                onChange={handleInputChange}
                placeholder="e.g. 7.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise (minutes)</label>
              <input
                type="number"
                name="exercise"
                value={dailyLog.exercise}
                onChange={handleInputChange}
                placeholder="e.g. 45"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={dailyLog.weight}
                onChange={handleInputChange}
                placeholder="e.g. 65.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="lg:col-span-5 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save Daily Log
              </button>
            </div>
          </form>
        </div>

        {/* Weekly Data Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Weekly Health Data </h2>
          {weeklyData.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No data available for this week.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleep</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protein</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiber</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fats</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyData.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{day.steps}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{day.water} glasses</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{day.sleep}h</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{day.exercise}min</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {day.weight}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {day.calories || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {day.protein || 0}g
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {day.fiber || 0}g
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {day.fat || 0}g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col-span-2 text-center mt-6 p-4 bg-gray-50 rounded-lg shadow">
          <h3 className="text-md font-semibold text-gray-700 mb-2">💡 Daily Health Reminder</h3>
          <p className=" text-gray-900">{quote}</p>
        </div>

      </div>
    </div>
  );
};

export default HealthAnalytics;