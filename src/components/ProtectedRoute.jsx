import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * Options:
 * - requireVerification: If true, also requires email verification
 *   (Google OAuth users are always verified, so they pass automatically)
 */
export default function ProtectedRoute({ children, requireVerification = true }) {
  const { currentUser } = useAuth();

  console.log('ProtectedRoute - currentUser:', currentUser?.email);
  console.log('ProtectedRoute - emailVerified:', currentUser?.emailVerified);
  console.log('ProtectedRoute - requireVerification:', requireVerification);

  // Not logged in - redirect to login
  if (!currentUser) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  // If email verification is required and user is not verified
  // (Note: Google OAuth users are always verified)
  if (requireVerification && !currentUser.emailVerified) {
    console.log('ProtectedRoute - User not verified, redirecting to verify-email');
    return <Navigate to="/verify-email" />;
  }

  console.log('ProtectedRoute - Access granted');
  return children;
}
