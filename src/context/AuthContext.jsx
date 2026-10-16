import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * AuthContext - Manages user authentication state
 * 
 * Provides:
 *   - user: Current authenticated user (null if not authenticated)
 *   - session: Current Supabase session
 *   - loading: Initial session loading state
 *   - signUp(email, password, fullName): Create new account
 *   - signIn(email, password): Sign in existing user
 *   - signOut(): Sign out current user
 *   - resetPassword(email): Send password reset email
 *   - updatePassword(newPassword): Update password after reset
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Initial session check & auth state listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Optional user metadata (e.g., full_name)
   * @returns {Promise<{ success: boolean, error?: string, requiresEmailConfirmation?: boolean }>}
   */
  const signUp = useCallback(async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      const requiresEmailConfirmation = !data.session;

      return {
        success: true,
        requiresEmailConfirmation,
        user: data.user,
      };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  /**
   * Sign in an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  /**
   * Sign out the current user
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  /**
   * Send a password reset email
   * @param {string} email - User email
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const resetPassword = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  /**
   * Update the user's password (after reset flow)
   * @param {string} newPassword - New password
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const updatePassword = useCallback(async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
