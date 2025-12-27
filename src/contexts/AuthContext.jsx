import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

const AuthContext = createContext();
const db = getFirestore();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create or update user document in Firestore
  async function createUserDocument(user) {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();
      
      try {
        await setDoc(userDocRef, {
          displayName: displayName || email.split('@')[0],
          email,
          photoURL,
          createdAt,
          lastLoginAt: createdAt,
          preferences: {
            theme: 'light',
            language: 'en'
          }
        });
        console.log('User document created');
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    } else {
      // Update last login
      try {
        await setDoc(userDocRef, {
          lastLoginAt: new Date()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating last login:', error);
      }
    }
  }

  // Sign up with email and password
  async function signup(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email after signup
    await sendVerificationEmail(result.user);
    return result;
  }

  // Sign in with email and password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google (Google accounts are pre-verified)
  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Sign out
  function logout() {
    return signOut(auth);
  }

  // Send email verification
  async function sendVerificationEmail(user = auth.currentUser) {
    if (!user) {
      console.error('No user provided for email verification');
      return;
    }
    
    console.log('Sending verification email to:', user.email);
    
    const actionCodeSettings = {
      // URL you want to redirect back to after verification
      url: `${window.location.origin}/email-verified`,
      handleCodeInApp: false,
    };
    
    try {
      await sendEmailVerification(user, actionCodeSettings);
      console.log('Verification email sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }

  // Reload current user to get fresh state from server
  async function reloadUser() {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setCurrentUser({ ...auth.currentUser });
    }
  }

  // Check if email is verified
  function isEmailVerified() {
    return auth.currentUser?.emailVerified || false;
  }

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await createUserDocument(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Send password reset email
  async function sendPasswordReset(email) {
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false,
    };
    
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    sendPasswordReset,
    reloadUser,
    isEmailVerified,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
