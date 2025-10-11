import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'BMI Calculator', href: '/bmi', icon: '⚖️' },
    { name: 'Meals Plan', href: '/meals', icon: '🥗' },
    { name: 'Nutrition Tracking', href: '/nutrition-tracking', icon: '📊' },
    { name: 'Health Analytics', href: '/health-analytics', icon: '📈' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: '🛠️' });
  }

  const isActive = (href) => location.pathname === href;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-2 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
          : 'py-3 bg-white/10 backdrop-blur-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Left: Logo (fixed left) */}
          <div className="flex-shrink-0">
            <Link
              to="/dashboard"
              className="text-3xl font-bold text-gray-800 tracking-tight"
              onClick={() => setIsMenuOpen(false)}
            >
              Nutrify
            </Link>
          </div>

          {/* Center: Navigation (exactly 6 items, perfectly centered) */}
          <div className="flex justify-center">
            <div className="flex space-x-0">
              {navigation.slice(0, 6).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-xl text-base font-medium transition-all duration-300 group ${
                    isActive(item.href)
                      ? 'text-primary-700 font-semibold'
                      : 'text-gray-600 hover:text-primary-700'
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-xl backdrop-blur-md border ${
                      isActive(item.href)
                        ? 'bg-primary-50/70 border-primary-200/60 shadow-[0_4px_12px_rgba(168,85,247,0.15)]'
                        : 'bg-white/60 border-white/40 opacity-0 group-hover:opacity-100 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                    } transition-all duration-300`}
                  ></div>
                  <span className="relative z-10 flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Logout (fixed right) */}
          <div className="flex-shrink-0">
            <button
              onClick={handleLogout}
              className="relative px-4 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-sm rounded-xl"></div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <span className="relative z-10">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex justify-between items-center h-16">
          <Link
            to="/dashboard"
            className="text-3xl font-bold text-gray-800 tracking-tight"
            onClick={() => setIsMenuOpen(false)}
          >
            Nutrify
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-white/50 hover:backdrop-blur-md transition-all duration-200"
          >
            {!isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 animate-fadeIn">
            <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl overflow-hidden">
              <div className="py-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center px-5 py-3.5 text-base font-medium ${
                      isActive(item.href)
                        ? 'text-primary-700 bg-primary-50/50'
                        : 'text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {item.name}
                    {isActive(item.href) && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary-500"></span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;