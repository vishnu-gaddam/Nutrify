import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/authContext";

  function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    height: "",
    weight: "",
    gender: "",
  });
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setNotification("");

  try {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const endpoint = isLogin ? "/api/users/login" : "/api/users/signup";
    const url = `${baseUrl}${endpoint}`; // ✅ Absolute URL

    const payload = isLogin
      ? { email: form.email, password: form.password }
      : form;

    const { data } = await axios.post(url, payload); // ✅ Now hits your Render backend

    login(data.user, data.token);
    setNotification(`Welcome${isLogin ? " back" : ""}, ${data.user.name || "User"}!`);

    setTimeout(() => {
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    }, 500);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Something went wrong. Please try again.";
    setNotification(message);
    setTimeout(() => setNotification(""), 4000);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-20">
        <h1 className="text-3xl font-bold tracking-wide">Nutrify</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg shadow-lg hover:scale-105 transition"
        >
          Get Started
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-screen flex items-center justify-center">
        <img
          src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
          alt="Healthy food"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        <div className="relative z-10 text-center max-w-3xl">
          <h1 className="text-8xl font-extrabold mb-4 text-yellow-500">Nutrify</h1>
          <h2 className="text-3xl font-bold mb-6 text-cyan-300"> Your smart health companion</h2>
          <p className="text-xl text-gray-200 mb-8">
            Track your nutrition, calculate BMI, get AI-powered meal
            suggestions, and take charge of your fitness journey.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-xl shadow-xl hover:scale-110 transition"
          >
            Start Your Journey
          </button>
        </div>
      </section>

<section className="w-full py-16 bg-gray-900 flex flex-col items-center space-y-12">
  <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">
    Track Your Progress
  </h2>

  <div className="max-w-7xl w-full flex flex-col space-y-12">
    {[
      {
        title: "BMI Calculator",
        desc: "Easily calculate your Body Mass Index to track your health and set fitness goals.",
        img: "/images/bmi.jpg",
        bg: "from-green-400 to-green-600",
      },
      {
        title: "Meals Suggestions",
        desc: "Personalized meal plans powered by AI to match your lifestyle and preferences.",
        img: "/images/mealsuggestion.jpg",
        bg: "from-purple-400 to-indigo-600",
      },
      {
        title: "Meals Tracking",
        desc: "Track your daily meals, calories, and nutrients with easy-to-use tools.",
        img: "/images/meal_tracking.jpg",
        bg: "from-pink-400 to-red-600",
      },
      {
        title: "Health Analytics",
        desc: "Learn why maintaining diet, nutrition, and fitness is key for a longer, happier life.",
        img: "/images/health_analytics.jpg",
        bg: "from-blue-400 to-cyan-600",
      },
    ].map((feature, i) => (
  <div
    key={i}
    className="relative p-[3px] rounded-2xl"
  >
    {/* Inner Card */}
    <div
      className={`relative flex flex-col md:flex-row ${
        i % 2 === 0 ? "" : "md:flex-row-reverse"
      } items-center rounded-2xl overflow-hidden bg-gray-900 shadow-2xl`}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${feature.bg} opacity-80`}></div>

      {/* Text Section */}
      <div className="relative z-10 flex-1 p-6 md:p-10 text-white text-center md:text-left">
        <h3 className="text-3xl md:text-4xl font-bold mb-3">{feature.title}</h3>
        <p className="text-md md:text-lg opacity-90 leading-relaxed">
          {feature.desc}
        </p>
      </div>

      {/* Image Section */}
      <div className="relative z-10 md:w-1/2 w-full h-64 md:h-80 overflow-hidden m-4 rounded-xl">
        <img
          src={feature.img}
          alt={feature.title}
          className="w-full h-full object-cover rounded-xl"
        />
          </div>
        </div>
      </div>
    ))}     
  </div>
</section>

  {/* Progress Tracker Preview */}

  <section className="bg-gray-900 py-20 relative overflow-hidden">
  {/* Decorative Background Gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-purple-900 to-gray-900 opacity-70"></div>

  <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
    {/* Section Title */}
    <h2 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 drop-shadow-lg mb-10">
      Starting is the hard part. We make it easy...
    </h2>

    {/* Card */}
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-10 ">
      {/* Description */}
      <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6 tracking-wide">
        Get detailed insights into your <span className="font-semibold text-green-300">calories</span>, 
        <span className="font-semibold text-blue-300"> workouts</span>, and 
        <span className="font-semibold text-purple-300"> goals</span> with our interactive dashboard.
      </p>

      {/* Image */}
      <div className="relative group">
        <img
          src="/images/footer.jpg"
          alt="Dashboard preview"
          className="w-full rounded-2xl shadow-xl"
        />
        {/* Subtle Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/20 to-blue-400/20 opacity-0 "></div>
      </div>
    </div>
  </div>
</section>

<footer className="bg-purple-800 text-gray-300 py-6 text-center">
  <p className="text-lg">
    © {new Date().getFullYear()} Nutrify. All rights reserved.
  </p>
</footer>

    

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-md z-30">
          <div className="bg-white/20 backdrop-blur-2xl border border-white/30 p-8 rounded-2xl shadow-2xl w-96 relative">
            <h2 className="text-2xl font-bold text-center mb-6 text-white">
              {isLogin ? "Login" : "Sign Up"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    name="height"
                    placeholder="Height (cm)"
                    value={form.height}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    name="weight"
                    placeholder="Weight (kg)"
                    value={form.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none"
                    required
                  />
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/30 text-white focus:outline-none"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male" className="text-black">
                      Male
                    </option>
                    <option value="female" className="text-black">
                      Female
                    </option>
                    <option value="other" className="text-black">
                      Other
                    </option>
                  </select>
                </>
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg hover:scale-105 transition"
              >
                {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
              </button>
            </form>
            <p className="text-center mt-4 text-gray-200">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                onClick={() => setIsLogin(!isLogin)}
                className="text-yellow-300 cursor-pointer hover:underline"
              >
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg font-semibold ${
              notification.includes("Welcome")
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notification}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
