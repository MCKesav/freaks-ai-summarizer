import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, signup, loginWithGoogle, currentUser, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for unverified user redirect
  useEffect(() => {
    if (searchParams.get('unverified') === 'true') {
      setShowResendVerification(true);
      setError('Please verify your email before accessing the dashboard.');
    }
  }, [searchParams]);

  // Redirect if already logged in AND verified
  useEffect(() => {
    if (currentUser) {
      console.log('Login page - currentUser detected:', currentUser.email);
      console.log('Login page - emailVerified:', currentUser.emailVerified);
      
      // Only redirect verified users to dashboard
      // Unverified users should stay on login or go to verify-email
      if (currentUser.emailVerified) {
        console.log('User is verified, redirecting to dashboard');
        navigate('/');
      } else {
        console.log('User is NOT verified, redirecting to verify-email');
        navigate('/verify-email');
      }
    }
  }, [currentUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signup(formData.email, formData.password);
        console.log('Signup successful, user created:', result.user.email);
        setMessage('Account created! Please check your email (including spam folder) to verify your account.');
        setShowResendVerification(true);
        // Clear form after successful signup
        setFormData({ email: '', password: '' });
        // Don't navigate - user needs to verify email first
      } else {
        await login(formData.email, formData.password);
        navigate('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setError(getErrorMessage(error.code));
      console.error('Google auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Failed to send verification email. Please try signing up again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign in was cancelled.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`login-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      <div className="login-card">
        {/* Logo Icon */}
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Google Login Button */}
        <button type="button" className="google-button" onClick={handleGoogleLogin} disabled={loading}>
          <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Success Message */}
        {message && <div className="success-message">{message}</div>}

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Resend Verification Button */}
        {showResendVerification && (
          <button 
            type="button" 
            className="resend-button"
            onClick={handleResendVerification}
            disabled={loading}
          >
            Resend Verification Email
          </button>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Input */}
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="login-input"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="login-input password-input"
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3L21 21M10.584 10.587C10.2087 10.962 9.99775 11.4708 9.99756 12.0014C9.99737 12.532 10.208 13.0409 10.583 13.416C10.958 13.7911 11.4668 14.002 11.9974 14.0022C12.528 14.0024 13.0369 13.7918 13.412 13.417M17.357 17.349C15.726 18.449 13.942 19 12 19C7 19 2.73 15.947 1 12C2.143 9.261 4.02 7.021 6.349 5.649M9.879 5.121C10.574 4.96 11.285 4.878 12 4.878C17 4.878 21.27 7.931 23 11.878C22.393 13.267 21.529 14.523 20.466 15.586" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Sign In Button */}
          <button type="submit" className="signin-button" disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Footer Links */}
        <div className="footer-links">
          <button onClick={() => setIsSignUp(!isSignUp)} className="footer-link toggle-link">
            {isSignUp ? 'Already have an account? Sign in' : 'New user? Sign up'}
          </button>
          <Link to="/forgot-password" className="footer-link">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
