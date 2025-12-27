import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RootLayout from './layouts/RootLayout';
import Login from './pages/Login';
import EmailVerified from './pages/EmailVerified';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import KnowledgeLab from './pages/KnowledgeLab';
import StudyArena from './pages/StudyArena';
import Commons from './pages/Commons';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Verify Email Route - requires login but not verification */}
          <Route path="/verify-email" element={
            <ProtectedRoute requireVerification={false}>
              <VerifyEmail />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes - require verification for email/password users */}
          <Route path="/" element={
            <ProtectedRoute requireVerification={true}>
              <RootLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="knowledge-lab" element={<KnowledgeLab />} />
            <Route path="study-arena" element={<StudyArena />} />
            <Route path="commons" element={<Commons />} />
          </Route>
          
          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
