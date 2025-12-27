/**
 * ResetPassword.jsx
 * 
 * Password reset action URL handler for Firebase Auth.
 * This page handles the password reset completion flow securely.
 * 
 * SECURITY CONSIDERATIONS:
 * 1. Validate action code before allowing password entry
 * 2. Enforce strong password requirements
 * 3. Don't reveal user email from action code (privacy)
 * 4. Handle expired/invalid codes gracefully
 * 5. Prevent token reuse attacks
 * 6. Rate limit password attempts (handled by Firebase)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  getAuth, 
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { CheckCircle, XCircle, Loader, KeyRound, ArrowRight, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import './ResetPassword.css';

// Reset states
const STATUS = {
  LOADING: 'loading',           // Validating action code
  READY: 'ready',               // Ready to enter new password
  SUBMITTING: 'submitting',     // Submitting new password
  SUCCESS: 'success',           // Password reset successful
  INVALID_CODE: 'invalid_code', // Invalid or expired code
  ERROR: 'error'                // General error
};

// Password strength levels
const PASSWORD_STRENGTH = {
  WEAK: { level: 1, label: 'Weak', color: '#EF4444' },
  FAIR: { level: 2, label: 'Fair', color: '#F59E0B' },
  GOOD: { level: 3, label: 'Good', color: '#10B981' },
  STRONG: { level: 4, label: 'Strong', color: '#059669' }
};

function ResetPassword() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState(''); // Retrieved from action code
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [oobCode, setOobCode] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = getAuth();

  // Check system/localStorage theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Validate action code on mount
  useEffect(() => {
    const validateCode = async () => {
      const mode = searchParams.get('mode');
      const code = searchParams.get('oobCode');

      // Validate required parameters
      if (mode !== 'resetPassword' || !code) {
        setStatus(STATUS.INVALID_CODE);
        setErrorMessage('Invalid password reset link. Please request a new one.');
        return;
      }

      setOobCode(code);

      try {
        // Verify the action code is valid
        // This returns the email associated with the reset request
        const userEmail = await verifyPasswordResetCode(auth, code);
        
        // Mask email for privacy (show only partial)
        const maskedEmail = maskEmail(userEmail);
        setEmail(maskedEmail);
        setStatus(STATUS.READY);
        
      } catch (error) {
        console.error('Invalid reset code:', error);
        setStatus(STATUS.INVALID_CODE);
        setErrorMessage(getErrorMessage(error.code));
      }
    };

    validateCode();
  }, [searchParams, auth]);

  /**
   * Mask email for privacy
   * example@gmail.com -> e***e@g***l.com
   */
  const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const [domainName, domainExt] = domain.split('.');
    
    const maskPart = (str) => {
      if (str.length <= 2) return str;
      return str[0] + '***' + str[str.length - 1];
    };
    
    return `${maskPart(localPart)}@${maskPart(domainName)}.${domainExt}`;
  };

  /**
   * Calculate password strength
   */
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return null;
    
    let score = 0;
    
    // Length checks
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    
    // Character type checks
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    
    // Determine strength level
    if (score <= 2) return PASSWORD_STRENGTH.WEAK;
    if (score <= 3) return PASSWORD_STRENGTH.FAIR;
    if (score <= 4) return PASSWORD_STRENGTH.GOOD;
    return PASSWORD_STRENGTH.STRONG;
  };

  /**
   * Handle password input change
   */
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  /**
   * Validate password requirements
   */
  const validatePassword = () => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return errors;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate password requirements
    const validationErrors = validatePassword();
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }

    setStatus(STATUS.SUBMITTING);

    try {
      // Confirm the password reset with Firebase
      await confirmPasswordReset(auth, oobCode, password);
      
      setStatus(STATUS.SUCCESS);
      
      // Auto redirect to login after success
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus(STATUS.READY);
      setErrorMessage(getErrorMessage(error.code));
    }
  };

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/expired-action-code': 'This password reset link has expired. Please request a new one.',
      'auth/invalid-action-code': 'This password reset link is invalid or has already been used.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  /**
   * Navigate to forgot password page to request new link
   */
  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  // Render different states
  const renderContent = () => {
    switch (status) {
      case STATUS.LOADING:
        return (
          <div className="reset-content">
            <div className="reset-icon loading">
              <Loader size={48} className="spin" />
            </div>
            <h1 className="reset-title">Validating Reset Link...</h1>
            <p className="reset-message">
              Please wait while we verify your password reset link.
            </p>
          </div>
        );

      case STATUS.READY:
      case STATUS.SUBMITTING:
        return (
          <div className="reset-content">
            <div className="reset-icon ready">
              <KeyRound size={48} />
            </div>
            <h1 className="reset-title">Create New Password</h1>
            <p className="reset-message">
              Enter a new password for <strong>{email}</strong>
            </p>

            {errorMessage && (
              <div className="error-message">
                <AlertTriangle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="reset-form">
              {/* New Password */}
              <div className="input-group">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="form-input"
                    autoComplete="new-password"
                    required
                    disabled={status === STATUS.SUBMITTING}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`strength-segment ${level <= passwordStrength.level ? 'active' : ''}`}
                          style={{ backgroundColor: level <= passwordStrength.level ? passwordStrength.color : undefined }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    autoComplete="new-password"
                    required
                    disabled={status === STATUS.SUBMITTING}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className={`match-indicator ${password === confirmPassword ? 'match' : 'no-match'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li className={password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                  <li className={/[a-z]/.test(password) ? 'met' : ''}>One lowercase letter</li>
                  <li className={/[A-Z]/.test(password) ? 'met' : ''}>One uppercase letter</li>
                  <li className={/[0-9]/.test(password) ? 'met' : ''}>One number</li>
                </ul>
              </div>

              <button 
                type="submit" 
                className="reset-button primary"
                disabled={status === STATUS.SUBMITTING}
              >
                {status === STATUS.SUBMITTING ? (
                  <>
                    <Loader size={20} className="spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        );

      case STATUS.SUCCESS:
        return (
          <div className="reset-content">
            <div className="reset-icon success">
              <CheckCircle size={48} />
            </div>
            <h1 className="reset-title">Password Reset Successful!</h1>
            <p className="reset-message">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <p className="redirect-notice">Redirecting to login...</p>
            <button 
              className="reset-button primary"
              onClick={() => navigate('/login')}
            >
              <span>Go to Login</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      case STATUS.INVALID_CODE:
        return (
          <div className="reset-content">
            <div className="reset-icon error">
              <XCircle size={48} />
            </div>
            <h1 className="reset-title">Link Expired or Invalid</h1>
            <p className="reset-message">
              {errorMessage}
            </p>
            <button 
              className="reset-button primary"
              onClick={handleRequestNewLink}
            >
              <span>Request New Link</span>
              <ArrowRight size={20} />
            </button>
            <button 
              className="reset-button secondary"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        );

      case STATUS.ERROR:
        return (
          <div className="reset-content">
            <div className="reset-icon error">
              <XCircle size={48} />
            </div>
            <h1 className="reset-title">Something Went Wrong</h1>
            <p className="reset-message">
              {errorMessage}
            </p>
            <button 
              className="reset-button primary"
              onClick={() => navigate('/login')}
            >
              <span>Back to Login</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`reset-password-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="reset-password-card">
        {/* Logo */}
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}

export default ResetPassword;
