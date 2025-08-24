import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createLoginActivityData } from '../utils/deviceDetection'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  // Fetch user profile from database
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // Don't throw - just return null and use metadata as fallback
        return null
      }

      setUserProfile(data)
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (mounted) {
          setSession(session)
          setUser(session?.user || null)

          // Try to fetch profile but don't block on it
          if (session?.user) {
            fetchUserProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setUserProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initialize
    initializeAuth()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user || null)

          if (session?.user) {
            fetchUserProfile(session.user.id)
          } else {
            setUserProfile(null)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Helper function to record login activity
  const recordLoginActivity = async (userId, success = true, failureReason = null, email = null) => {
    try {
      const activityData = await createLoginActivityData(userId, success, failureReason)
      
      // For failed logins, we might not have userId, so try to get it via API call
      if (!userId && email && !success) {
        try {
          // Use API call to record failed login (will use service role key)
          const response = await fetch(
            import.meta.env.DEV ? 'http://localhost:3001/api/login-activities/record-failed' : '/.netlify/functions/api/login-activities/record-failed',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                ...activityData
              })
            }
          )
          
          if (!response.ok) {
            console.error('Failed to record failed login via API')
          }
          return
        } catch (apiError) {
          console.error('API call for failed login failed:', apiError)
        }
      }
      
      // Insert login activity record directly
      const { error } = await supabase
        .from('login_activities')
        .insert([activityData])
      
      if (error) {
        console.error('Failed to record login activity:', error)
      }
    } catch (error) {
      console.error('Error recording login activity:', error)
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    let userId = null
    
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Record failed login attempt (will try to get userId via API)
        await recordLoginActivity(null, false, error.message, email)
        
        return { success: false, error: error.message }
      }

      userId = data.user.id
      
      // Record successful login
      await recordLoginActivity(userId, true)

      return { success: true, user: data.user }
    } catch (error) {
      // Record failed login if we have user ID
      if (userId) {
        await recordLoginActivity(userId, false, error.message)
      }
      
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Sign up new user
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error signing out:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update password
  const updatePassword = async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get user profile from custom users table with timeout
  const getUserProfile = async (userId) => {
    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Enhanced API call helper with comprehensive session management and retry logic
  const apiCall = async (endpoint, options = {}, retryCount = 0) => {
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second base delay
    
    try {
      // Enhanced session validation with detailed logging
      console.log(`🔐 API CALL: Starting request to ${endpoint} (attempt ${retryCount + 1})`);
      
      let session;
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ SESSION ERROR:', sessionError);
          throw new Error(`Session validation failed: ${sessionError.message}`);
        }
        
        session = currentSession;
      } catch (sessionFetchError) {
        console.error('❌ SESSION FETCH ERROR:', sessionFetchError);
        throw new Error(`Failed to retrieve session: ${sessionFetchError.message}`);
      }

      // Enhanced session validation
      if (!session) {
        console.error('❌ NO ACTIVE SESSION: User needs to re-authenticate');
        throw new Error('Authentication required - no active session found');
      }
      
      // Check token expiry
      if (session.expires_at && Date.now() / 1000 > session.expires_at) {
        console.warn('⚠️ TOKEN EXPIRED: Attempting refresh before API call');
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshedSession) {
            throw new Error(`Token refresh failed: ${refreshError?.message || 'No refreshed session'}`);
          }
          session = refreshedSession;
          console.log('✅ TOKEN REFRESHED: Using new session for API call');
        } catch (refreshError) {
          console.error('❌ TOKEN REFRESH FAILED:', refreshError);
          throw new Error(`Token refresh failed: ${refreshError.message}`);
        }
      }
      
      // Validate session components
      if (!session.access_token) {
        console.error('❌ INVALID SESSION: No access token found');
        throw new Error('Invalid session - missing access token');
      }
      
      if (!user?.id) {
        console.error('❌ INVALID USER: No user ID available');
        throw new Error('Invalid user state - user ID not available');
      }

      const API_BASE_URL = import.meta.env.DEV
        ? 'http://localhost:3001/api'
        : '/.netlify/functions/api'

      const url = `${API_BASE_URL}${endpoint}`
      
      // Enhanced request configuration with better headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-Role': getUserRole(),
          'X-User-Id': user.id,
          'X-Session-Id': session.access_token.substring(0, 10), // Partial token for debugging
          'X-Request-Time': new Date().toISOString(),
          ...options.headers,
        },
        ...options,
      }

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body)
      }
      
      console.log(`🌐 MAKING REQUEST: ${config.method || 'GET'} ${url}`);
      console.log(`🔑 AUTH HEADERS: User Role: ${config.headers['X-User-Role']}, User ID: ${config.headers['X-User-Id']}`);

      const response = await fetch(url, config)
      
      console.log(`📡 RESPONSE STATUS: ${response.status} ${response.statusText}`);

      // Enhanced error handling for different status codes
      if (response.status === 401) {
        console.error('❌ 401 UNAUTHORIZED: Token expired or invalid');
        
        // Only retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`🔄 RETRYING: Attempt ${retryCount + 1} of ${maxRetries}`);
          
          try {
            // Force session refresh
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !newSession) {
              throw new Error(`Session refresh failed during retry: ${refreshError?.message}`);
            }
            
            console.log('✅ SESSION REFRESHED: Retrying API call with new token');
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
            
            // Recursive retry with incremented count
            return await apiCall(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            console.error('❌ RETRY FAILED: Session refresh error:', refreshError);
            throw new Error(`Authentication failed after retry: ${refreshError.message}`);
          }
        } else {
          console.error('❌ MAX RETRIES EXCEEDED: Authentication failed permanently');
          throw new Error(`Authentication failed - maximum retries (${maxRetries}) exceeded`);
        }
      }
      
      if (response.status === 403) {
        console.error('❌ 403 FORBIDDEN: Insufficient permissions');
        throw new Error('Access denied - insufficient permissions for this operation');
      }
      
      if (response.status === 429) {
        console.warn('⚠️ 429 RATE LIMITED: Too many requests');
        throw new Error('Rate limited - please wait before making more requests');
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON PARSE ERROR:', parseError, 'Response:', responseText);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      } catch (responseError) {
        console.error('❌ RESPONSE READ ERROR:', responseError);
        throw new Error(`Failed to read response: ${responseError.message}`);
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`❌ API ERROR (${response.status}):`, errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('✅ API CALL SUCCESS:', {
        endpoint,
        status: response.status,
        dataSize: JSON.stringify(data).length,
        attempt: retryCount + 1
      });

      return data
    } catch (error) {
      // Enhanced error logging with context
      console.error('❌ API CALL FAILED:', {
        endpoint,
        attempt: retryCount + 1,
        maxRetries,
        error: error.message,
        stack: error.stack?.split('\n')[0] // First line of stack for context
      });
      
      // Add context to error message
      const contextualError = new Error(`API call to ${endpoint} failed: ${error.message}`);
      contextualError.originalError = error;
      contextualError.endpoint = endpoint;
      contextualError.attempt = retryCount + 1;
      
      throw contextualError;
    }
  }


  // Role checking with fallbacks
  const getUserRole = () => {
    // Priority: database profile > user metadata > default
    return userProfile?.role ||
      user?.user_metadata?.role ||
      'account_officer'
  }

  const isAdmin = getUserRole() === 'admin'
  const isAccountOfficer = getUserRole() === 'account_officer'

  // Analytics methods using materialized views
  const getMonthlyAnalytics = async (startDate, endDate) => {
    try {
      let query = supabase
        .from('mv_monthly_spending')
        .select('*')
        .order('month', { ascending: false });

      if (startDate) query = query.gte('month', startDate);
      if (endDate) query = query.lte('month', endDate);

      // Apply role-based filtering
      if (!isAdmin) {
        query = query.eq('created_by', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch monthly analytics:', error);
      return { success: false, error: error.message };
    }
  }

  const getCategoryAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('mv_category_spending')
        .select('*')
        .order('total_amount', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch category analytics:', error);
      return { success: false, error: error.message };
    }
  }

  const getUserAnalytics = async () => {
    try {
      let query = supabase
        .from('mv_user_spending')
        .select('*');

      // Non-admins can only see their own data
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      return { success: false, error: error.message };
    }
  }

  const refreshAnalytics = async (includeInsights = false) => {
    try {
      // Only admins can force refresh
      if (!isAdmin) {
        return { success: false, error: 'Access denied' };
      }

      if (includeInsights) {
        // Use the enhanced refresh function that includes insights
        const { data, error } = await supabase.rpc('smart_refresh_all');
        if (error) throw error;
        
        return { 
          success: true, 
          message: 'Analytics and insights refreshed',
          details: data
        };
      } else {
        // Use the standard analytics refresh
        const { error } = await supabase.rpc('smart_refresh_analytics');
        if (error) throw error;

        return { success: true, message: 'Analytics refreshed' };
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      return { success: false, error: error.message };
    }
  }

  const value = {
    user,
    session,
    loading,
    userProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    getUserProfile,
    apiCall,
    isAdmin,
    isAccountOfficer,
    getUserRole,
    // Analytics methods
    getMonthlyAnalytics,
    getCategoryAnalytics,
    getUserAnalytics,
    refreshAnalytics,
    // Legacy aliases for compatibility
    login: signIn,
    logout: signOut,
    register: signUp,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}