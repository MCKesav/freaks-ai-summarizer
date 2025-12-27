import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <div className="verify-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1>Check Your Email</h1>
        
        <p className="verify-description">
          We've sent a verification link to:
        </p>
        
        <p className="user-email">{currentUser?.email}</p>
        
        <p className="verify-instructions">
          Click the link in your email to verify your account and access the dashboard.
          <br /><br />
          <strong>Don't forget to check your spam folder!</strong>
        </p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="verify-actions">
          <button 
            onClick={handleResendEmail} 
            disabled={loading}
            className="verify-button primary"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <button onClick={handleLogout} className="logout-link">
          Use a different email
        </button>
      </div>
    </div>
  );
}
