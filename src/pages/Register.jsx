import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ FIXED: Only redirect if user is already authenticated (from previous login)
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation checks
    if (!formData?.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!formData?.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!formData?.password?.trim()) {
      toast.error('Password is required');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Register data matching backend expectations
    const registerData = {
      name: formData.name.trim(),           
      email: formData.email.trim(),         
      passwordHash: formData.password       
    };
    
    console.log('Register data being sent:', JSON.stringify(registerData, null, 2));
    console.log('Form data:', JSON.stringify(formData, null, 2));
    
    try {
      console.log('🚀 Starting registration process...');
      const result = await register(registerData);
      console.log('📥 Registration result:', result);
      
      if (result.success) {
        console.log('✅ Registration successful!');
        
        // ✅ AUTO-REDIRECT TO LOGIN PAGE AFTER SUCCESSFUL REGISTRATION
        console.log('🔄 Redirecting to login page...');
        
        // Small delay to ensure success toast is visible
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              registrationSuccess: true,
              message: `Welcome ${result.userData?.name || formData.name}! Your account has been created successfully. Please login with your credentials.`,
              email: formData.email.trim(), // Pre-fill email on login page
              fromRegistration: true
            }
          });
        }, 1500); // 1.5 second delay to show success toast
        
      } else {
        console.error('❌ Registration failed:', result.error);
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('💥 Registration submission error:', error);
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Show loading/redirect screen if user is already authenticated
  if (isAuthenticated && !loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Field */}
          <div className="form-group">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Field */}
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

          {/* Password Field - No Confirm Password */}
          <div className="form-group">
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="auth-button"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
