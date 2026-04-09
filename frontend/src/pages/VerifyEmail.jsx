import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const { verifyOTP, resendOTP } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      return setError('Please enter a valid 6-digit code');
    }

    try {
      setLoading(true);
      setError('');
      await verifyOTP(email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError('');
      const res = await resendOTP(email);
      setMessage(res.message);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📧</div>
          <h2 className="auth-title">Verify Your Email</h2>
          <p className="auth-subtitle">We've sent a 6-digit verification code to <br/><strong>{email}</strong></p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message" style={{ color: 'var(--primary)', marginBottom: '16px', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Verification Code</label>
            <input 
              type="text" 
              className="input text-center" 
              placeholder="000000"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: '8px', fontSize: '1.5rem', textAlign: 'center' }}
              disabled={loading}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Didn't receive the code?</p>
          <button 
            className="btn btn-link" 
            onClick={handleResend} 
            disabled={resending || loading}
            style={{ padding: '0', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {resending ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
