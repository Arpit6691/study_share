import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setUnverifiedEmail('');
      const data = await login(email.trim(), password);
      
      if (data?.requiresVerification) {
        navigate('/verify-email', { state: { email: data.email || email.trim() } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.requiresVerification) {
        setError(resp.message || 'Please verify your email before logging in.');
        setUnverifiedEmail(resp.email || email.trim());
      } else if (resp?.message) {
        setError(resp.message);
      } else if (!err.response) {
        setError('Cannot connect to backend server. Please verify backend is running on port 5000.');
      } else {
        setError('Invalid credentials or server error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setError('');
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Google authentication failed');
    }
  };

  return (
    <div className="main-container auth-container">
      <div className="card animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.4rem', margin: '0 auto 16px' }}>S</div>
            <h2 className="page-title" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Login</h2>
            <p style={{ color: 'var(--subtext)', fontSize: '0.95rem' }}>Welcome back to StudyShare.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '14px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div>{error}</div>
            {unverifiedEmail && (
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ marginTop: '10px', width: '100%', padding: '8px', fontSize: '0.8rem' }}
                onClick={() => navigate('/verify-email', { state: { email: unverifiedEmail } })}
              >
                Verify Code Now →
              </button>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address or Username</label>
            <input 
              type="text" 
              className="input"
              placeholder="e.g. arpit@kiet.edu or username" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input"
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Secure Login'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--subtext)', fontWeight: '700' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin 
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google Sign-In failed or was closed. Please ensure http://localhost:5173 is added to Authorized JavaScript Origins in Google Cloud Console.');
            }}
            theme="filled_black" 
            shape="pill"
            width="100%"
          />
        </div>

        <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.95rem', color: 'var(--subtext)' }}>
          New to StudyShare? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
