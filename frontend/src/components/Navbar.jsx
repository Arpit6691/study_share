import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logo} alt="StudyShare Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
          <span>StudyShare</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          {user && (
            <>
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/my-files" className={`nav-link ${location.pathname === '/my-files' ? 'active' : ''}`}>My Files</Link>
              <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>Upload</Link>
              <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>Leaderboard</Link>
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</Link>
            </>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="nav-actions desktop-only">
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

        {/* Mobile Hamburger Toggle Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown animate-fade-in">
          <Link to="/" className="mobile-nav-link" onClick={closeMenu}>🏠 Home</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>📊 Dashboard</Link>
              <Link to="/my-files" className="mobile-nav-link" onClick={closeMenu}>📁 My Files</Link>
              <Link to="/upload" className="mobile-nav-link" onClick={closeMenu}>📤 Upload Material</Link>
              <Link to="/leaderboard" className="mobile-nav-link" onClick={closeMenu}>🏆 Leaderboard</Link>
              <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>👤 Profile</Link>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
                <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
              <Link to="/login" className="btn btn-outline" onClick={closeMenu} style={{ width: '100%' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" onClick={closeMenu} style={{ width: '100%' }}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
