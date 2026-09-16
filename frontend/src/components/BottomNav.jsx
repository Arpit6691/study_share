import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BottomNav = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Only show bottom nav for logged in users on main app pages
  if (!user) return null;

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/my-files', label: 'My Files', icon: '📁' },
    { path: '/upload', label: 'Upload', icon: '➕', highlight: true },
    { path: '/leaderboard', label: 'Top 5', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-btn' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
