import React from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './utils/authContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BMICalculator from './pages/BMICalculator';
import MealsPlan from './pages/MealsPlan';
import HealthAnalytics from './pages/HealthAnalytics'; // Renamed import for clarity
import Profile from './pages/Profile';
import NutritionTracking from './pages/NutritionTracking'; // Renamed import for clarity
import Admin from './pages/Admin';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main App Component
function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bmi" 
            element={
              <ProtectedRoute>
                <BMICalculator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/meals" 
            element={
              <ProtectedRoute>
                <MealsPlan />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/health-analytics" 
            element={
              <ProtectedRoute>
                <HealthAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nutrition-tracking" 
            element={
              <ProtectedRoute>
                <NutritionTracking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;