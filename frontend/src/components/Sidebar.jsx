import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'My Files', path: '/my-files', icon: '📁' },
    { name: 'Upload Material', path: '/upload', icon: '📤' },
    { name: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MENU</h2>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink 
            key={item.name}
            to={item.path} 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <p style={{ fontSize: '0.75rem', color: 'var(--subtext)', textAlign: 'center' }}>© 2026 StudyShare Beta</p>
      </div>
    </div>
  );
};

export default Sidebar;
