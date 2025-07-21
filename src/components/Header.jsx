import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  // ✅ EXTRACT USER NAME WITH FALLBACKS
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // Try different possible field names for user name
    return user.name || 
           user.userName || 
           user.fullName || 
           user.displayName || 
           user.firstName || 
           (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
           user.email?.split('@')[0] || // Use email username as fallback
           'User';
  };

  // ✅ GET USER EMAIL WITH FALLBACKS
  const getUserEmail = () => {
    if (!user) return '';
    return user.email || user.userEmail || user.emailAddress || '';
  };

  // ✅ GET USER INITIALS FOR AVATAR
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const email = getUserEmail();
    
    if (displayName && displayName !== 'User') {
      // Get initials from name
      return displayName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2) // Max 2 initials
        .join('');
    } else if (email) {
      // Get initials from email
      return email.charAt(0).toUpperCase();
    } else {
      return 'U';
    }
  };

  return (
    <motion.header 
      className="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-content">
        <div className="logo">
          <h2>TaskMaster</h2>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {/* ✅ SHOW USER INITIALS */}
              <span className="user-initials">{getUserInitials()}</span>
            </div>
            <div className="user-details">
              {/* ✅ SHOW ACTUAL USER NAME */}
              <span className="user-name">{getUserDisplayName()}</span>
              {/* ✅ SHOW USER EMAIL IF AVAILABLE */}
              {getUserEmail() && (
                <span className="user-email">{getUserEmail()}</span>
              )}
            </div>
          </div>
          
          <motion.button
            className="logout-btn"
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`Logout ${getUserDisplayName()}`}
          >
            <FaSignOutAlt />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
