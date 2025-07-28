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
  const recordLoginActivity = async (userId, success = true, failureReason = null) => {
    try {
      const activityData = await createLoginActivityData(userId, success, failureReason)
      
      // Insert login activity record
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
        // Try to get user ID for failed login tracking
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()
        
        userId = userData?.id
        
        // Record failed login attempt
        if (userId) {
          await recordLoginActivity(userId, false, error.message)
        }
        
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

  // API call helper with automatic auth headers
  const apiCall = async (endpoint, options = {}) => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const API_BASE_URL = import.meta.env.DEV
        ? 'http://localhost:3001/api'
        : '/.netlify/functions/api'

      const url = `${API_BASE_URL}${endpoint}`
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-Role': getUserRole(),
          'X-User-Id': user?.id,
          ...options.headers,
        },
        ...options,
      }

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body)
      }

      const response = await fetch(url, config)

      if (response.status === 401) {
        // Token might be expired, try to refresh
        await supabase.auth.refreshSession()
        throw new Error('Authentication required')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (error) {
      console.error('API call error:', error)
      throw error
    }
  }

  // Demo login functions
  const loginAsAdmin = () => signIn('admin1@test.com', 'admin123')
  const loginAsOfficer = () => signIn('officer1@test.com', 'officer123')

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

  const refreshAnalytics = async () => {
    try {
      // Only admins can force refresh
      if (!isAdmin) {
        return { success: false, error: 'Access denied' };
      }

      const { error } = await supabase.rpc('smart_refresh_analytics');
      if (error) throw error;

      return { success: true, message: 'Analytics refreshed' };
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
    loginAsAdmin,
    loginAsOfficer,
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