import React, { useState } from "react";
import { motion } from "framer-motion";

function BMICalculator() {
  const [formData, setFormData] = useState({ 
    weight: "", 
    height: "", 
    heightUnit: "cm", 
    age: "", 
    gender: "" 
  });
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.weight || formData.weight < 20 || formData.weight > 500) 
      newErrors.weight = "Weight must be between 20-500 kg";
    if (!formData.height) 
      newErrors.height = "Height is required";
    else {
      const heightInCm = formData.heightUnit === "ft" 
        ? parseFloat(formData.height) * 30.48 
        : parseFloat(formData.height);
      
      if (heightInCm < 50 || heightInCm > 300) {
        newErrors.height = formData.heightUnit === "cm" 
          ? "Height must be between 50-300 cm" 
          : `Height must be between ${(50/30.48).toFixed(2)}-${(300/30.48).toFixed(2)} ft`;
      }
    }
    if (!formData.age || formData.age < 1 || formData.age > 120) 
      newErrors.age = "Age must be between 1-120";
    if (!formData.gender) 
      newErrors.gender = "Please select gender";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateBMI = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const weight = parseFloat(formData.weight);
    let heightInCm = parseFloat(formData.height);

    if (formData.heightUnit === "ft") {
      heightInCm = heightInCm * 30.48;
    }

    const heightInM = heightInCm / 100;
    const bmi = weight / (heightInM * heightInM);

    let category, color, recommendation;
    if (bmi < 18.5) { 
      category = "Underweight"; 
      color = "text-blue-600"; 
      recommendation = "Add more nutritious calories to your diet."; 
    }
    else if (bmi < 25) { 
      category = "Normal"; 
      color = "text-green-600"; 
      recommendation = "Great job! Keep maintaining your healthy lifestyle."; 
    }
    else if (bmi < 30) { 
      category = "Overweight"; 
      color = "text-amber-600"; 
      recommendation = "Try balancing workouts and diet for improvement."; 
    }
    else { 
      category = "Obese"; 
      color = "text-red-600"; 
      recommendation = "Consult with a healthcare professional."; 
    }

    setResult({ 
      bmi: bmi.toFixed(1), 
      category, 
      color, 
      recommendation, 
      ...formData 
    });
  };

  const resetForm = () => {
    setFormData({ weight: "", height: "", heightUnit: "cm", age: "", gender: "" });
    setResult(null);
    setErrors({});
  };

  const bmiRanges = [
    { 
      category: "Underweight", 
      range: "< 18.5", 
      color: "bg-blue-50 text-blue-800 border-blue-200", 
      description: "Below normal weight" 
    },
    { 
      category: "Normal", 
      range: "18.5 - 24.9", 
      color: "bg-green-50 text-green-800 border-green-200", 
      description: "Healthy weight range" 
    },
    { 
      category: "Overweight", 
      range: "25.0 - 29.9", 
      color: "bg-amber-50 text-amber-800 border-amber-200", 
      description: "Above normal weight" 
    },
    { 
      category: "Obese", 
      range: "≥ 30.0", 
      color: "bg-red-50 text-red-800 border-red-200", 
      description: "Well above normal weight" 
    },
  ];

  return (
    <div className="min-h-screen bg-[#e1ffd8] text-gray-800 py-12 px-4 sm:px-6">
      <motion.div className="max-w-7xl mx-auto space-y-10">
        
        {/* ----------- Top Heading ----------- */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">BMI Calculator</h1>
          <p className="mt-4 text-gray-600 text-lg max-w-3xl mx-auto">
            Calculate your Body Mass Index (BMI) to assess your weight category and get personalized health insights.
          </p>
        </div>

        {/* ----------- Calculate Your BMI Card ----------- */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Calculate Your BMI</h2>
          <form onSubmit={calculateBMI} className="space-y-5">
            <div>
              <label className="block mb-2 font-medium text-gray-700">Weight (kg)</label>
              <input 
                type="number" 
                name="weight" 
                value={formData.weight} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter weight"
              />
              {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter height"
                />
                <select
                  name="heightUnit"
                  value={formData.heightUnit}
                  onChange={handleInputChange}
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
              {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Age</label>
                <input 
                  type="number" 
                  name="age" 
                  value={formData.age} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter age"
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="submit" 
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition shadow-md"
              >
                Calculate BMI
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="flex-1 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Result Section */}
          {result && (
            <motion.div 
              className="mt-8 space-y-6" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                <p className="text-5xl font-bold text-gray-900">{result.bmi}</p>
                <p className={`text-xl font-semibold mt-2 ${result.color}`}>{result.category}</p>
                <p className="mt-3 text-gray-600 max-w-md mx-auto">{result.recommendation}</p>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 font-medium text-gray-700">Weight</th>
                      <th className="p-3 font-medium text-gray-700">Height</th>
                      <th className="p-3 font-medium text-gray-700">Age</th>
                      <th className="p-3 font-medium text-gray-700">Gender</th>
                      <th className="p-3 font-medium text-gray-700">BMI</th>
                      <th className="p-3 font-medium text-gray-700">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3">{result.weight} kg</td>
                      <td className="p-3">{result.height} {result.heightUnit}</td>
                      <td className="p-3">{result.age}</td>
                      <td className="p-3 capitalize">{result.gender}</td>
                      <td className="p-3 font-medium">{result.bmi}</td>
                      <td className={`p-3 font-medium ${result.color}`}>{result.category}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">BMI Visualization</h3>
                <div className="relative h-6 bg-gradient-to-r from-blue-400 via-green-400 to-red-400 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-3 h-6 bg-black rounded-full z-10"
                    style={{ 
                      left: `${Math.min(Math.max(((parseFloat(result.bmi) - 15) / 20) * 100, 5), 95)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>15</span>
                  <span>20</span>
                  <span>25</span>
                  <span>30</span>
                  <span>35</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ----------- BMI Categories Card ----------- */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">BMI Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bmiRanges.map((range, index) => {
                const isActive = result && result.category === range.category;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${range.color}`}>
                          {range.category}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{range.description}</p>
                      </div>
                      <p className="font-semibold text-gray-800">{range.range}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* ----------- Healthy BMI Ranges Table Card ----------- */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Healthy BMI Ranges by Age and Gender</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-700 p-3  text-white font-medium">
                <tr>
                  <th>Age Group</th>
                  <th>Gender</th>
                  <th>Height Range</th>
                  <th>Weight Range</th>
                  <th className="p-3 text-white">Healthy BMI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["19–24", "Male/Female", "160–180 cm", "54–81 kg", "19–24"],
                  ["25–34", "Male/Female", "160–180 cm", "57–85 kg", "20–25"],
                  ["35–44", "Male/Female", "159–179 cm", "58–88 kg", "21–26"],
                  ["45–54", "Male/Female", "158–178 cm", "60–90 kg", "22–27"],
                  ["55–64", "Male/Female", "157–177 cm", "62–92 kg", "23–28"],
                  ["65+", "Male/Female", "155–175 cm", "63–94 kg", "24–29"]
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* ----------- About BMI Card ----------- */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">About BMI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center mr-2">i</span>
                What is BMI?
              </h4>
              <p className="text-gray-600">
                Body Mass Index (BMI) is a simple calculation using a person’s height and weight. 
                Formula: <span className="font-mono">BMI = kg/m²</span>
              </p>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                <span className="bg-amber-100 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center mr-2">!</span>
                Important Note
              </h4>
              <p className="text-gray-600">
                BMI is a screening tool, not a diagnostic one. It doesn’t account for muscle mass, 
                bone density, or body composition differences.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default BMICalculator;