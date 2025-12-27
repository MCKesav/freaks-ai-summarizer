/**
 * EmailVerified.jsx
 * 
 * Public email verification landing page for Firebase Auth Action URL.
 * This page handles the email verification completion flow securely.
 * 
 * SECURITY CONSIDERATIONS:
 * 1. Never trust frontend state without calling reload()
 * 2. Never auto-login users - they must authenticate themselves
 * 3. Handle cross-device verification (user may verify on different device)
 * 4. Prevent redirect loops
 * 5. Don't expose sensitive data in URL or UI
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  getAuth, 
  applyActionCode, 
  checkActionCode,
  reload 
} from 'firebase/auth';
import { CheckCircle, XCircle, Loader, Mail, ArrowRight } from 'lucide-react';
import './EmailVerified.css';

// Verification states
const STATUS = {
  LOADING: 'loading',      // Initial state, processing verification
  SUCCESS: 'success',      // Email verified successfully
  ALREADY_VERIFIED: 'already_verified', // User already verified
  ERROR: 'error',          // Verification failed
  INVALID_CODE: 'invalid_code', // Invalid or expired action code
  REDIRECTING: 'redirecting'   // Redirecting to dashboard
};

function EmailVerified() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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

  useEffect(() => {
    /**
     * Main verification flow
     * 
     * Firebase sends users here with query params:
     * - mode: 'verifyEmail' (or resetPassword, etc.)
     * - oobCode: the verification code
     * - apiKey: (optional) Firebase API key
     * - continueUrl: (optional) where to redirect after
     */
    const handleVerification = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      // Step 1: Validate we have the required parameters
      if (mode !== 'verifyEmail' || !oobCode) {
        // User may have landed here directly or with invalid params
        // Check if they're already logged in and verified
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Reload to get fresh state from server (SECURITY: never trust cached state)
          try {
            await reload(currentUser);
            
            if (currentUser.emailVerified) {
              setStatus(STATUS.REDIRECTING);
              // Small delay for UX - show success before redirect
              setTimeout(() => navigate('/'), 1500);
              return;
            }
          } catch (error) {
            console.error('Error reloading user:', error);
          }
        }
        
        // No valid params and not verified - show generic success page
        // (User might have clicked link on different device and already verified)
        setStatus(STATUS.SUCCESS);
        return;
      }

      // Step 2: Verify the action code is valid before applying
      // This prevents applying expired/invalid codes
      try {
        await checkActionCode(auth, oobCode);
      } catch (error) {
        console.error('Invalid action code:', error);
        
        // Code might be expired or already used
        // Check if user is already verified (code was used successfully before)
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            await reload(currentUser);
            if (currentUser.emailVerified) {
              setStatus(STATUS.ALREADY_VERIFIED);
              return;
            }
          } catch (reloadError) {
            console.error('Error reloading user:', reloadError);
          }
        }
        
        setStatus(STATUS.INVALID_CODE);
        setErrorMessage(getErrorMessage(error.code));
        return;
      }

      // Step 3: Apply the verification code
      try {
        await applyActionCode(auth, oobCode);
        console.log('Action code applied successfully');
        
        // Step 4: Reload the current user to update emailVerified status
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // SECURITY: Always reload after applyActionCode to get fresh server state
          await reload(currentUser);
          console.log('User reloaded, emailVerified:', currentUser.emailVerified);
          
          if (currentUser.emailVerified) {
            // User is logged in and now verified - redirect to dashboard
            setStatus(STATUS.REDIRECTING);
            setTimeout(() => navigate('/'), 1500);
            return;
          }
        }
        
        // User verified successfully - show success and auto-redirect
        // (This handles both logged-in and cross-device scenarios)
        setStatus(STATUS.SUCCESS);
        // Auto redirect after showing success message
        setTimeout(() => navigate('/'), 2500);
        
      } catch (error) {
        console.error('Error applying action code:', error);
        setStatus(STATUS.ERROR);
        setErrorMessage(getErrorMessage(error.code));
      }
    };

    handleVerification();
  }, [searchParams, auth, navigate]);

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/expired-action-code': 'This verification link has expired. Please request a new one.',
      'auth/invalid-action-code': 'This verification link is invalid or has already been used.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email address.',
    };
    return errorMessages[errorCode] || 'An error occurred during verification. Please try again.';
  };

  /**
   * Navigate to login page
   */
  const handleContinueToLogin = () => {
    navigate('/login');
  };

  /**
   * Request a new verification email (if user is logged in)
   */
  const handleResendVerification = async () => {
    // This would need sendEmailVerification from AuthContext
    // For now, direct to login where they can request again
    navigate('/login');
  };

  // Render different states
  const renderContent = () => {
    switch (status) {
      case STATUS.LOADING:
        return (
          <div className="verification-content">
            <div className="verification-icon loading">
              <Loader size={48} className="spin" />
            </div>
            <h1 className="verification-title">Verifying your email...</h1>
            <p className="verification-message">
              Please wait while we confirm your email address.
            </p>
          </div>
        );

      case STATUS.REDIRECTING:
        return (
          <div className="verification-content">
            <div className="verification-icon success">
              <CheckCircle size={48} />
            </div>
            <h1 className="verification-title">Email Verified!</h1>
            <p className="verification-message">
              Redirecting you to the dashboard...
            </p>
            <div className="verification-loader">
              <Loader size={24} className="spin" />
            </div>
          </div>
        );

      case STATUS.SUCCESS:
      case STATUS.ALREADY_VERIFIED:
        return (
          <div className="verification-content">
            <div className="verification-icon success">
              <CheckCircle size={48} />
            </div>
            <h1 className="verification-title">
              {status === STATUS.ALREADY_VERIFIED 
                ? 'Already Verified!' 
                : 'Email Verified Successfully!'}
            </h1>
            <p className="verification-message">
              {status === STATUS.ALREADY_VERIFIED
                ? 'Your email address has already been verified.'
                : 'Thank you for verifying your email address. Your account is now fully activated.'}
            </p>
            <p className="redirect-notice">Redirecting to dashboard...</p>
            <button 
              className="verification-button primary"
              onClick={() => navigate('/')}
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      case STATUS.INVALID_CODE:
        return (
          <div className="verification-content">
            <div className="verification-icon warning">
              <Mail size={48} />
            </div>
            <h1 className="verification-title">Link Expired</h1>
            <p className="verification-message">
              {errorMessage}
            </p>
            <button 
              className="verification-button primary"
              onClick={handleResendVerification}
            >
              <span>Request New Link</span>
              <ArrowRight size={20} />
            </button>
            <button 
              className="verification-button secondary"
              onClick={handleContinueToLogin}
            >
              Back to Login
            </button>
          </div>
        );

      case STATUS.ERROR:
        return (
          <div className="verification-content">
            <div className="verification-icon error">
              <XCircle size={48} />
            </div>
            <h1 className="verification-title">Verification Failed</h1>
            <p className="verification-message">
              {errorMessage}
            </p>
            <button 
              className="verification-button primary"
              onClick={handleContinueToLogin}
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
    <div className={`email-verified-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="email-verified-card">
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

export default EmailVerified;
