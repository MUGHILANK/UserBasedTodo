import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  try {
    const { isAuthenticated, loading, user, token } = useAuth();

    // Show loading spinner while authentication is being checked
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    // Validate authentication state
    try {
      // Check if user has valid authentication
      const hasValidAuth = isAuthenticated && (user || token);
      
      if (!hasValidAuth) {
        // Clear any invalid auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
      }

      // Additional token validation if token exists
      if (token) {
        try {
          // Basic JWT structure validation
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return <Navigate to="/login" replace />;
          }
        } catch (tokenError) {
          // Invalid token format, clear and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return <Navigate to="/login" replace />;
        }
      }

    } catch (authValidationError) {
      // Error during auth validation, clear data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    // User is authenticated, render protected content
    return children;

  } catch (error) {
    // Catch any unexpected errors in the component
    // Clear auth data and redirect to login as fallback
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (storageError) {
      // Even localStorage failed, just redirect
    }
    
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
