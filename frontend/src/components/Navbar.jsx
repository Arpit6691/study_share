import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <img src={logo} alt="StudyShare Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          <span>StudyShare</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/upload" className="nav-link">Upload</Link>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
            </>
          )}
        </div>
        <div className="nav-actions">
          {!user ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="nav-link" style={{ alignSelf: 'center' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 20px' }}>Get Started</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
