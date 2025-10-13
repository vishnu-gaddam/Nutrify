import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../utils/authContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

//const API_BASE = "http://localhost:5001/api/meals";
//const USER_API_BASE = "http://localhost:5001/api/users";
const API_BASE = process.env.REACT_APP_API_BASE_URL + "/api/meals";
const USER_API_BASE = process.env.REACT_APP_API_BASE_URL + "/api/users";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMeals, setSavedMeals] = useState([]);
  const [weeklyMeals, setWeeklyMeals] = useState([]);

  // Fetch saved meals for stats
  useEffect(() => {
    if (!user?.id) return;

    const fetchSavedMeals = async () => {
      try {
        const weeklyRes = await axios.get(`${API_BASE}/saved/${user.id}`);
        const allMeals = weeklyRes.data.meals || [];
        setWeeklyMeals(allMeals);
        
        // Get today's date in YYYY-MM-DD format (local timezone)
        const today = new Date();
        const todayString = today.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
        
        // Filter meals for today and remove duplicates
        const todayMeals = allMeals.filter(meal => {
          if (!meal.addedAt) return false;
          const mealDate = new Date(meal.addedAt);
          const mealDateString = mealDate.toLocaleDateString('en-CA');
          return mealDateString === todayString;
        });
        
        // Remove duplicate meals (same _id)
        const uniqueTodayMeals = todayMeals.filter((meal, index, self) =>
          index === self.findIndex(m => m._id === meal._id)
        );
        
        setSavedMeals(uniqueTodayMeals);
      } catch (err) {
        console.error("Failed to fetch saved meals:", err);
        setSavedMeals([]);
        setWeeklyMeals([]);
      }
    };

    fetchSavedMeals();
  }, [user?.id]);

  // ✅ FETCH USER DATA FROM BACKEND ON LOAD
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${USER_API_BASE}/me`);
        const userData = response.data;
        
        updateUser(userData);
        setProfileData(userData);
        
        // ✅ Split name for display, but store as single field
        const parts = (userData.name || "").trim().split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";

        if (!isEditing) {
          setEditData({
            name: userData.name || "",
            firstName,
            lastName,
            email: userData.email || "",
            age: userData.age?.toString() || "",
            gender: userData.gender || "",
            height: userData.height?.toString() || "",
            weight: userData.weight?.toString() || "",
            activityLevel: userData.activityLevel || "moderate",
          });
        }
      } catch (err) {
        console.error("Failed to fetch user ", err);
        if (!isEditing && user) {
          const parts = (user.name || "").trim().split(" ");
          const firstName = parts[0] || "";
          const lastName = parts.slice(1).join(" ") || "";
          
          setEditData({
            name: user.name || "",
            firstName,
            lastName,
            email: user.email || "",
            age: user.age?.toString() || "",
            gender: user.gender || "",
            height: user.height?.toString() || "",
            weight: user.weight?.toString() || "",
            activityLevel: user.activityLevel || "moderate",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();// eslint-disable-next-line
  }, [user?.id]);

  // Calculate BMI category for display
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-500", textColor: "text-blue-600" };
    if (bmi < 25) return { label: "Normal", color: "bg-green-500", textColor: "text-green-600" };
    if (bmi < 30) return { label: "Overweight", color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { label: "Obese", color: "bg-red-500", textColor: "text-red-600" };
  };

  // Calculate BMI from height and weight
  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null;
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    if (isNaN(heightInMeters) || isNaN(weightInKg) || heightInMeters <= 0) return null;
    return weightInKg / (heightInMeters * heightInMeters);
  };

  // Memoized BMI calculation
  const currentBMI = useMemo(() => {
    if (editData.height && editData.weight) {
      return calculateBMI(editData.height, editData.weight);
    }
    return profileData?.bmi ? parseFloat(profileData.bmi) : null;
  }, [editData.height, editData.weight, profileData?.bmi]);

  const formattedBMI = currentBMI ? currentBMI.toFixed(1) : null;
  const bmiInfo = formattedBMI ? getBMICategory(parseFloat(formattedBMI)) : null;

  // Calculate profile completion - ✅ FIXED for backend fields
  const calculateCompletion = () => {
    if (!profileData) return 0;
    // ✅ Use fields that actually exist in your backend
    const fields = ['name', 'email', 'age', 'gender', 'height', 'weight', 'activityLevel'];
    const filledFields = fields.filter(field => {
      const value = profileData[field];
      return value !== null && value !== undefined && value !== "" && 
             (['age', 'height', 'weight'].includes(field) ? parseFloat(value) > 0 : true);
    }).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completion = calculateCompletion();

  // Calculate stats
  const mealCount = savedMeals.length;
  const activeDays = useMemo(() => {
    const dates = new Set();
    weeklyMeals.forEach(meal => {
      if (meal.addedAt) {
        const date = new Date(meal.addedAt).toISOString().split('T')[0];
        dates.add(date);
      }
    });
    return dates.size;
  }, [weeklyMeals]);

  // Calculate weekly and monthly progress
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const thisWeekMeals = weeklyMeals.filter(meal => new Date(meal.addedAt) >= weekAgo);
    return {
      meals: thisWeekMeals.length,
      days: new Set(thisWeekMeals.map(m => new Date(m.addedAt).toISOString().split('T')[0])).size
    };
  }, [weeklyMeals]);

  const monthlyProgress = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    const thisMonthMeals = weeklyMeals.filter(meal => new Date(meal.addedAt) >= monthAgo);
    return {
      meals: thisMonthMeals.length,
      days: new Set(thisMonthMeals.map(m => new Date(m.addedAt).toISOString().split('T')[0])).size
    };
  }, [weeklyMeals]);

  // Handle edit
  const handleEditClick = () => {
    setIsEditing(true);
    setSaveError("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError("");
    if (profileData) {
      const parts = (profileData.name || "").trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      
      setEditData({
        name: profileData.name || "",
        firstName,
        lastName,
        email: profileData.email || "",
        age: profileData.age?.toString() || "",
        gender: profileData.gender || "",
        height: profileData.height?.toString() || "",
        weight: profileData.weight?.toString() || "",
        activityLevel: profileData.activityLevel || "moderate",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Sync full name when first/last name changes
      if (name === 'firstName' || name === 'lastName') {
        updated.name = [updated.firstName || '', updated.lastName || '']
          .filter(part => part.trim() !== '')
          .join(' ');
      }
      
      return updated;
    });
  };

  // ✅ Save profile - only send backend-supported fields
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setSaveLoading(true);
    setSaveError("");
    
    try {
      //const newBMI = calculateBMI(editData.height, editData.weight);
      
      // ✅ Only send fields your backend actually accepts
      const profileToUpdate = {
        name: editData.name,
        email: editData.email,
        age: editData.age ? parseInt(editData.age) : undefined,
        gender: editData.gender,
        height: editData.height ? parseFloat(editData.height) : undefined,
        weight: editData.weight ? parseFloat(editData.weight) : undefined,
        activityLevel: editData.activityLevel || "moderate",
      };

      const response = await axios.put(`${USER_API_BASE}/me`, profileToUpdate);
      const fullUpdatedUser = response.data.user;

      updateUser(fullUpdatedUser);
      setProfileData(fullUpdatedUser);
      setIsEditing(false);
      setSaveLoading(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSaveError("Failed to update profile. Please try again.");
      setSaveLoading(false);
    }
  };

  // Activity Level Display Mapping
  const getActivityLevelDisplay = (level) => {
    const displayMap = {
      'sedentary': 'Sedentary (little or no exercise)',
      'light': 'Light (exercise 1-3 days/week)',
      'moderate': 'Moderate (exercise 3-5 days/week)',
      'active': 'Active (exercise 6-7 days/week)',
      'very-active': 'Very Active (hard exercise daily)'
    };
    return displayMap[level] || "Not provided";
  };

  // Modern BMI Card Design
  const BMICard = ({ bmi, bmiInfo }) => {
    if (!bmi || !bmiInfo) {
      return (
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Complete Your Profile</h3>
          <p className="text-gray-500 text-sm">Add your height and weight to calculate your BMI</p>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 h-full border border-gray-200 shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Body Mass Index</h3>
          <div className={`inline-block px-4 py-2 rounded-full text-white font-bold text-lg ${bmiInfo.color}`}>
            {bmi}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${bmiInfo.color}`}>
                {bmiInfo.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${bmiInfo.color}`}
                style={{ 
                  width: bmi < 18.5 ? '25%' : 
                         bmi < 25 ? '50%' : 
                         bmi < 30 ? '75%' : '100%' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 text-xs">
            <div className="text-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-600">Under</span>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-600">Normal</span>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-600">Over</span>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-600">Obese</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Goals Content Component
  const GoalsContent = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Set Your Health Goals</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-800">Weight Management</h3>
            <p className="text-gray-600 text-sm">Set target weight and track your progress over time</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-800">Nutrition Goals</h3>
            <p className="text-gray-600 text-sm">Define daily calorie, protein, and fiber targets</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-800">Activity Goals</h3>
            <p className="text-gray-600 text-sm">Set exercise frequency and intensity targets</p>
          </div>
          <div className="border-l-4 border-amber-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-800">Meal Planning</h3>
            <p className="text-gray-600 text-sm">Create weekly meal plans aligned with your goals</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/meals')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium"
          >
            Start Setting Goals
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e1ffd8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#e1ffd8] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Please Log In</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e1ffd8] p-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {isEditing ? "Edit Profile" : "Your Profile"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isEditing ? "Update your personal information" : "Manage your account and track your health journey"}
          </p>
        </div>

        {isEditing ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editData.firstName || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editData.lastName || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={editData.age || ""}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={editData.gender || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={editData.height || ""}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={editData.weight || ""}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
                <select
                  name="activityLevel"
                  value={editData.activityLevel || "moderate"}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="light">Light (exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                  <option value="active">Active (exercise 6-7 days/week)</option>
                  <option value="very-active">Very Active (hard exercise daily)</option>
                </select>
              </div>

              {currentBMI && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">BMI Preview</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-800">{currentBMI.toFixed(1)}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                      currentBMI < 18.5 ? 'bg-blue-500' : 
                      currentBMI < 25 ? 'bg-green-500' : 
                      currentBMI < 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {getBMICategory(currentBMI).label}
                    </span>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-xl border border-red-200">
                  {saveError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium text-lg"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-medium text-lg disabled:opacity-50"
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Full Name:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {profileData?.name || "Not provided"}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Email:</div>
                      <div className="flex-1 text-gray-800 font-medium">{profileData?.email || "Not provided"}</div>
                    </div>
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Age:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {profileData?.age ? `${profileData.age} years` : "Not provided"}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Gender:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {profileData?.gender || "Not provided"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Height:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {profileData?.height ? `${profileData.height} cm` : "Not provided"}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Weight:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {profileData?.weight ? `${profileData.weight} kg` : "Not provided"}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">Activity Level:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {getActivityLevelDisplay(profileData?.activityLevel)}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-32 text-gray-600 font-medium">BMI:</div>
                      <div className="flex-1 text-gray-800 font-medium">
                        {formattedBMI ? (
                          <span className={`px-2 py-1 rounded-full text-sm font-medium text-white ${
                            bmiInfo?.color
                          }`}>
                            {formattedBMI} - {bmiInfo?.label}
                          </span>
                        ) : "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <BMICard bmi={formattedBMI} bmiInfo={bmiInfo} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Profile Complete</h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">{completion}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                    style={{ width: `${completion}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Complete for better recommendations</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Meals Today</h3>
                <div className="text-2xl font-bold text-green-600 mb-2">{mealCount}</div>
                <p className="text-sm text-gray-600">Logged today</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Active Days</h3>
                <div className="text-2xl font-bold text-purple-600 mb-2">{activeDays}</div>
                <p className="text-sm text-gray-600">This month</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
                <button
                  onClick={handleEditClick}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition font-medium"
                >
                  Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition font-medium"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Progress, Navigation, etc. - keep as is */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-center">Weekly Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Meals Logged</span>
                      <span className="text-green-600 font-medium">{weeklyProgress.meals}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (weeklyProgress.meals / 21) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Active Days</span>
                      <span className="text-blue-600 font-medium">{weeklyProgress.days}/7</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(weeklyProgress.days / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-center">Monthly Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Meals Logged</span>
                      <span className="text-purple-600 font-medium">{monthlyProgress.meals}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (monthlyProgress.meals / 90) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Active Days</span>
                      <span className="text-amber-600 font-medium">{monthlyProgress.days}/30</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${(monthlyProgress.days / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/meals"
                className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg p-6 text-center hover:from-green-600 hover:to-emerald-700 transition"
              >
                <div className="text-3xl mb-2">🍽️</div>
                <h3 className="font-bold text-lg mb-1">Meal Planner</h3>
                <p className="text-green-100 text-sm">Plan your daily meals</p>
              </Link>
              
              <Link
                to="/nutrition"
                className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-lg p-6 text-center hover:from-amber-600 hover:to-orange-700 transition"
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-lg mb-1">Nutrition Tracking</h3>
                <p className="text-amber-100 text-sm">Monitor your intake</p>
              </Link>
              
              <button
                onClick={() => navigate('/goals')}
                className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg p-6 text-center hover:from-purple-600 hover:to-indigo-700 transition"
              >
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold text-lg mb-1">Set Goals</h3>
                <p className="text-purple-100 text-sm">Define your targets</p>
              </button>
            </div>

            {window.location.pathname === '/goals' && <GoalsContent />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;