import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });
  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.name, formData.username, formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Wait! Registration failed. User might already exist.');
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (error) {
      alert('Google authentication failed');
    }
  };

  return (
    <div className="main-container auth-container">
      <div className="card animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.4rem', margin: '0 auto 16px' }}>S</div>
            <h2 className="page-title" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Create Account</h2>
            <p style={{ color: 'var(--subtext)', fontSize: '0.95rem' }}>Join thousands of students sharing notes.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="input"
              placeholder="e.g. Arpit Kumar" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="input"
              placeholder="e.g. arpit_pro" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="input"
              placeholder="e.g. arpit@kiet.edu" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input"
              placeholder="••••••••" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', marginTop: '12px' }}>
            Get Started
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--subtext)', fontWeight: '700' }}>OR SIGNUP WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin 
            onSuccess={handleGoogleSuccess} 
            theme="filled_black" 
            shape="pill"
            width="100%"
          />
        </div>

        <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.95rem', color: 'var(--subtext)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
