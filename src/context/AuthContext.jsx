import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return { ...state, loading: true };
      
    case 'AUTH_INIT_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
      
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
      
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: true, 
        user: action.payload.user, 
        token: action.payload.token,
        error: null
      };
      
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        isAuthenticated: false,
        user: null,
        token: null
      };
      
    case 'LOGOUT':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null, 
        token: null, 
        loading: false,
        error: null
      };
      
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };
      
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        loading: false,
        error: null
      };
      
    case 'REGISTER_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload
      };
      
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  });

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      dispatch({ type: 'AUTH_INIT_START' });
      
      try {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        
        if (token && userString) {
          try {
            const user = JSON.parse(userString);
            
            dispatch({
              type: 'AUTH_INIT_SUCCESS',
              payload: { 
                isAuthenticated: true, 
                token, 
                user 
              }
            });
          } catch (parseError) {
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

    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // LOGIN FUNCTION - Requires token authentication
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.login(credentials);
      
      let token, user;
      
      if (response.data) {
        // Extract token - try different possible field names
        token = response.data.token || 
                response.data.accessToken || 
                response.data.authToken ||
                response.data.jwtToken ||
                response.data.access_token;
        
        // Extract user information from login response
        user = {
          id: response.data.userId || 
              response.data.id || 
              response.data.user?.id ||
              response.data.sub,
          name: response.data.name || 
                response.data.userName || 
                response.data.user?.name || 
                response.data.fullName ||
                response.data.displayName,
          email: response.data.email || 
                 response.data.userEmail || 
                 response.data.user?.email ||
                 response.data.emailAddress,
          // Include any other fields from response
          ...response.data.user,
          // Spread the response data in case everything is at root level
          ...(response.data.name || response.data.email ? response.data : {})
        };
        
        // Remove token fields from user object
        delete user.token;
        delete user.accessToken;
        delete user.authToken;
        delete user.jwtToken;
        delete user.access_token;
        delete user.passwordHash; // Remove password hash if present
        
        // Validate required fields for login
        if (!token) {
          throw new Error('No authentication token received from server');
        }
        
        if (!user.email && !user.id) {
          user = { ...response.data };
          // Clean up sensitive fields
          delete user.token;
          delete user.accessToken;
          delete user.authToken;
          delete user.jwtToken;
          delete user.access_token;
          delete user.passwordHash;
        }
        
      } else {
        throw new Error('Invalid response structure from server');
      }
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user }
      });
      
      toast.success(`Welcome back, ${user.name || user.email || 'User'}!`);
      return { success: true };
      
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.errors) {
        const validationMessages = [];
        for (const [field, messages] of Object.entries(error.response.data.errors)) {
          validationMessages.push(`${field}: ${messages.join(', ')}`);
        }
        errorMessage = `Login failed: ${validationMessages.join('; ')}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // REGISTER FUNCTION - No token required, just creates user
  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await authAPI.register(userData);
      
      // Registration successful - just check for success status
      if (response.status === 200 || response.status === 201) {
        // Extract user data for success message
        const registeredUser = response.data;
        const userName = registeredUser.name || 
                        registeredUser.userName || 
                        registeredUser.email ||
                        userData.name;
        
        // Show success message
        toast.success(`Registration successful! Welcome ${userName}! Please login with your credentials.`);
        
        dispatch({ type: 'REGISTER_SUCCESS' });
        
        return { 
          success: true, 
          needsLogin: true,
          userData: registeredUser
        };
      } else {
        throw new Error(`Registration failed with status: ${response.status}`);
      }
      
    } catch (error) {
      let errorMessage = 'Registration failed';
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationMessages = [];
        for (const [field, messages] of Object.entries(error.response.data.errors)) {
          validationMessages.push(`${field}: ${messages.join(', ')}`);
        }
        errorMessage = `Registration failed: ${validationMessages.join('; ')}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      dispatch({ type: 'REGISTER_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // LOGOUT FUNCTION
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully!');
  };

  // Utility functions
  const isTokenValid = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Basic JWT validation (check if it's properly formatted)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const getCurrentUser = () => {
    return state.user;
  };

  const getCurrentToken = () => {
    return state.token;
  };

  const contextValue = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    
    // Utilities
    isTokenValid,
    getCurrentUser,
    getCurrentToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

export default AuthContext;
