import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_INIT_START':
      console.log('🔄 Auth initialization started');
      return { ...state, loading: true };
    case 'AUTH_INIT_SUCCESS':
      console.log('✅ Auth initialization success:', action.payload);
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'LOGIN_START':
      console.log('🔄 Login started');
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      console.log('✅ Login success:', action.payload);
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: true, 
        user: action.payload.user, 
        token: action.payload.token 
      };
    case 'LOGIN_FAILURE':
      console.log('❌ Login failure:', action.payload);
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      console.log('🚪 Logout');
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null, 
        token: null, 
        loading: false 
      };
    case 'REGISTER_START':
      console.log('🔄 Register started');
      return { ...state, loading: true, error: null };
    case 'REGISTER_SUCCESS':
      console.log('✅ Register success:', action.payload);
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: true, 
        user: action.payload.user, 
        token: action.payload.token 
      };
    case 'REGISTER_FAILURE':
      console.log('❌ Register failure:', action.payload);
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true, // Start with loading true
    error: null
  });

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      dispatch({ type: 'AUTH_INIT_START' });
      
      try {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        
        console.log('🔍 Checking localStorage:', {
          tokenExists: !!token,
          userExists: !!userString,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
          userPreview: userString ? userString.substring(0, 50) + '...' : 'null'
        });
        
        if (token && userString) {
          try {
            const user = JSON.parse(userString);
            console.log('✅ Auth initialized from localStorage:', { 
              token: !!token, 
              user: user 
            });
            
            dispatch({
              type: 'AUTH_INIT_SUCCESS',
              payload: { 
                isAuthenticated: true, 
                token, 
                user 
              }
            });
          } catch (parseError) {
            console.error('❌ Error parsing user from localStorage:', parseError);
            // Clear corrupted data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({
              type: 'AUTH_INIT_SUCCESS',
              payload: { 
                isAuthenticated: false, 
                token: null, 
                user: null 
              }
            });
          }
        } else {
          console.log('ℹ️ No auth data found in localStorage');
          dispatch({
            type: 'AUTH_INIT_SUCCESS',
            payload: { 
              isAuthenticated: false, 
              token: null, 
              user: null 
            }
          });
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({
          type: 'AUTH_INIT_SUCCESS',
          payload: { 
            isAuthenticated: false, 
            token: null, 
            user: null 
          }
        });
      }
    };

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      console.log('🔄 Attempting login with:', JSON.stringify(credentials, null, 2));
      const response = await authAPI.login(credentials);
      console.log('📥 Full login response:', response);
      console.log('📥 Login response data:', response.data);
      
      // Handle different possible response structures
      let token, user;
      
      if (response.data) {
        // Check if token is directly in data
        if (response.data.token) {
          token = response.data.token;
          user = { ...response.data };
          delete user.token; // Remove token from user object
        }
        // Check if there's a nested structure
        else if (response.data.data && response.data.data.token) {
          token = response.data.data.token;
          user = { ...response.data.data };
          delete user.token;
        }
        // Check for other possible structures
        else if (response.data.accessToken) {
          token = response.data.accessToken;
          user = { ...response.data };
          delete user.accessToken;
        }
        // If no token found, use entire response as user data
        else {
          console.warn('⚠️ No token found in response, using entire response as user data');
          token = 'temp-token'; // Temporary fallback
          user = response.data;
        }
      } else {
        throw new Error('Invalid response structure');
      }

      console.log('💾 Storing auth data:', { 
        token: token ? token.substring(0, 20) + '...' : 'null', 
        user 
      });
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify storage worked
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      console.log('✅ Verification - Data stored successfully:', {
        tokenStored: !!storedToken,
        userStored: !!storedUser
      });
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user }
      });
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ LOGIN ERROR DETAILS ===');
      console.error('Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      console.error('Full Error:', error);
      
      // Handle different error structures
      if (error.response?.data?.errors) {
        const validationMessages = [];
        for (const [field, messages] of Object.entries(error.response.data.errors)) {
          validationMessages.push(`${field}: ${messages.join(', ')}`);
        }
        toast.error(`Login failed: ${validationMessages.join('; ')}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.title) {
        toast.error(error.response.data.title);
      } else {
        toast.error('Login failed. Please try again.');
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      console.log('🔄 Attempting registration with:', JSON.stringify(userData, null, 2));
      const response = await authAPI.register(userData);
      console.log('📥 Registration response:', response.data);
      
      // Handle different possible response structures (same as login)
      let token, user;
      
      if (response.data) {
        if (response.data.token) {
          token = response.data.token;
          user = { ...response.data };
          delete user.token;
        } else if (response.data.data && response.data.data.token) {
          token = response.data.data.token;
          user = { ...response.data.data };
          delete user.token;
        } else if (response.data.accessToken) {
          token = response.data.accessToken;
          user = { ...response.data };
          delete user.accessToken;
        } else {
          console.warn('⚠️ No token found in registration response');
          token = 'temp-token';
          user = response.data;
        }
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { token, user }
      });
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ REGISTRATION ERROR DETAILS ===');
      console.error('Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const validationMessages = [];
        for (const [field, messages] of Object.entries(error.response.data.errors)) {
          validationMessages.push(`${field}: ${messages.join(', ')}`);
        }
        toast.error(`Registration failed: ${validationMessages.join('; ')}`);
      } else {
        const errorMessage = error.response?.data?.message || 'Registration failed';
        toast.error(errorMessage);
      }
      
      dispatch({ type: 'REGISTER_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully!');
  };

  // Debug current state
  useEffect(() => {
    console.log('🔍 Auth State Changed:', {
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      hasUser: !!state.user,
      hasToken: !!state.token
    });
  }, [state.isAuthenticated, state.loading, state.user, state.token]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
