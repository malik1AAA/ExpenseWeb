import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * useInactivityTimeout - Hook to automatically sign out users after 2 minutes of inactivity
 * 
 * Features:
 * - Tracks user activity (mouse, keyboard, scroll, touch)
 * - Resets timer on activity
 * - Handles tab visibility changes
 * - Clears sensitive data on timeout
 * - Shows notification before logout
 * - Prevents multiple simultaneous signouts
 * 
 * @param {number} timeoutMs - Inactivity timeout in milliseconds (default: 120000 = 2 minutes)
 */
export const useInactivityTimeout = (timeoutMs = 120000) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isSigningOutRef = useRef(false);
  const notificationShownRef = useRef(false);

  // Public routes that should not trigger timeout
  const publicRoutes = ['/login', '/signup', '/reset-password', '/update-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  /**
   * Clear the inactivity timer
   */
  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Reset the inactivity timer
   */
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    notificationShownRef.current = false;
    
    clearTimer();
    
    if (user && !isPublicRoute) {
      timeoutRef.current = setTimeout(() => {
        handleInactivityTimeout();
      }, timeoutMs);
    }
  }, [user, isPublicRoute, timeoutMs, clearTimer]);

  /**
   * Handle inactivity timeout - sign out user and redirect to login
   */
  const handleInactivityTimeout = useCallback(async () => {
    // Prevent multiple simultaneous signouts
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;

    try {
      // Show notification to user
      const notificationMessage = 'You were signed out due to 2 minutes of inactivity. Please sign in again.';
      
      // Clear any existing notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Session Expired', {
          body: notificationMessage,
          icon: '/favicon.ico',
          tag: 'inactivity-timeout'
        });
      }

      // Sign out user
      const result = await signOut();
      
      if (result.success) {
        // Clear sensitive data from memory
        lastActivityRef.current = 0;
        notificationShownRef.current = false;
        
        // Show alert and redirect to login
        // Use setTimeout to ensure signOut completes before navigation
        setTimeout(() => {
          alert(notificationMessage);
          navigate('/login', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error during inactivity timeout:', error);
    } finally {
      isSigningOutRef.current = false;
    }
  }, [signOut, navigate]);

  /**
   * Handle user activity events
   */
  const handleActivity = useCallback(() => {
    if (user && !isPublicRoute) {
      resetTimer();
    }
  }, [user, isPublicRoute, resetTimer]);

  /**
   * Handle visibility change - check elapsed time when tab becomes visible
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab is hidden - clear timer to prevent background timeout
      clearTimer();
    } else {
      // Tab is visible again - check if we should timeout
      if (user && !isPublicRoute) {
        const elapsed = Date.now() - lastActivityRef.current;
        
        if (elapsed >= timeoutMs) {
          // User was inactive while tab was hidden
          handleInactivityTimeout();
        } else {
          // Reset timer with remaining time
          resetTimer();
        }
      }
    }
  }, [user, isPublicRoute, timeoutMs, clearTimer, resetTimer, handleInactivityTimeout]);

  /**
   * Handle beforeunload - save last activity timestamp
   */
  const handleBeforeUnload = useCallback(() => {
    // Store last activity time in sessionStorage for cross-tab sync
    if (user) {
      sessionStorage.setItem('lastActivity', lastActivityRef.current.toString());
    }
  }, [user]);

  /**
   * Handle storage event - sync activity across tabs
   */
  const handleStorage = useCallback((event) => {
    if (event.key === 'lastActivity' && event.newValue) {
      const storedTime = parseInt(event.newValue, 10);
      
      // If another tab was more recently active, update our timer
      if (storedTime > lastActivityRef.current) {
        lastActivityRef.current = storedTime;
        resetTimer();
      }
    }
  }, [resetTimer]);

  // Set up event listeners
  useEffect(() => {
    if (!user || isPublicRoute) {
      clearTimer();
      return;
    }

    // Restore last activity from sessionStorage if available
    const storedLastActivity = sessionStorage.getItem('lastActivity');
    if (storedLastActivity) {
      lastActivityRef.current = parseInt(storedLastActivity, 10);
    }

    // Activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Add activity listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Add storage listener for cross-tab sync
    window.addEventListener('storage', handleStorage);

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimer();
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user, isPublicRoute, handleActivity, handleVisibilityChange, handleBeforeUnload, handleStorage, clearTimer, resetTimer]);

  // Handle user changes (login/logout)
  useEffect(() => {
    if (!user) {
      clearTimer();
      lastActivityRef.current = 0;
      notificationShownRef.current = false;
      isSigningOutRef.current = false;
      sessionStorage.removeItem('lastActivity');
    }
  }, [user, clearTimer]);

  // Return control methods for external use if needed
  return {
    resetTimer,
    clearTimer,
    lastActivity: lastActivityRef.current,
  };
};
