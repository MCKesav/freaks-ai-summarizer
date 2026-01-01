import { createClient } from "@supabase/supabase-js";
import { getFirebaseIdToken, getCurrentUser } from "./firebase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create default Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Create authenticated Supabase client with Firebase ID token
 * @returns {Promise<object>} Supabase client with Firebase authentication
 */
export const createAuthenticatedClient = async () => {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      console.warn('No Firebase user found, using anonymous Supabase client');
      return supabase;
    }

    const firebaseIdToken = await getFirebaseIdToken(true);
    
    // Create authenticated client with Firebase token in headers
    const authenticatedClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${firebaseIdToken}`,
          },
        },
      }
    );

    return authenticatedClient;
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    return supabase;
  }
};

/**
 * Get Supabase client (authenticated if user is logged in)
 * @param {boolean} forceAuth - Force authentication requirement
 * @returns {Promise<object>} Supabase client
 */
export const getSupabaseClient = async (forceAuth = false) => {
  const user = getCurrentUser();
  
  if (user || forceAuth) {
    return await createAuthenticatedClient();
  }
  
  return supabase;
};

// Export clients for convenience
export { supabase };
export default supabase;