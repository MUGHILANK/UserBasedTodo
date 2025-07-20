import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();

  // Enhanced logging for auth state changes
  useEffect(() => {
    console.log('🔍 Login Component - Auth State:', {
      isAuthenticated,
      loading,
      hasUser: !!user,
      hasToken: !!token,
      userPreview: user ? JSON.stringify(user).substring(0, 100) : 'null'
    });
    
    if (isAuthenticated && !loading) {
      console.log('✅ Login Component: User is authenticated, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, user, token]);

  const handleSubmit = async () => {
    // e.preventDefault();
    
    console.log('🚀 Login form submitted');
    console.log('📝 Form data:', formData);
    
    if (!formData?.email?.trim()) {
      console.log('❌ Email validation failed');
      toast.error('Email is required');
      return;
    }
    
    if (!formData?.password?.trim()) {
      console.log('❌ Password validation failed');
      toast.error('Password is required');
      return;
    }

    const loginData = {
      email: formData.email.trim(),
      passwordHash: formData.password
    };
    
    console.log('📤 Login data being sent:', JSON.stringify(loginData, null, 2));
    console.log('🔄 Calling login function...');
    
    try {
      console.log('⏳ Awaiting login response...');
      const result = await login(loginData);
      console.log('📥 Login function returned:', result);
      debugger
      console.log(result.data);
      if (result && result.success) {
        console.log('✅ Login reported success');
        
        // Check if auth data was actually stored
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('💾 Post-login localStorage check:', {
          tokenExists: !!storedToken,
          userExists: !!storedUser,
          tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : 'null'
        });
        
        console.log('⏭️ Login successful, useEffect should handle navigation');
      } else {
        console.log('❌ Login reported failure:', result);
      }
    } catch (error) {
      console.error('💥 Login submission error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Input changed: ${name} = "${value}"`);
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Enhanced redirect screen logging
  if (isAuthenticated && !loading) {
    console.log('🔄 Showing redirect screen - user authenticated');
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Redirecting...</p>
      </div>
    );
  }

  console.log('🎨 Rendering login form');

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {/* <form onSubmit={handleSubmit} className="auth-form"> */}
          <div className="form-group">
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <motion.button
          onClick={()=>handleSubmit()}
            type="button"
            className="auth-button"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </motion.button>
        {/* </form> */}

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
