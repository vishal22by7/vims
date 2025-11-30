import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown')) {
        document.querySelectorAll('.profile-dropdown-menu').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated && user?.role === 'admin' ? '/admin' : '/dashboard'} className="navbar-brand">
          🚗 VIMS
        </Link>
        
        {isAuthenticated && (
          <div className="navbar-menu">
            {user?.role === 'admin' ? (
              <>
                <Link to="/admin" className="navbar-link">Dashboard</Link>
                <Link to="/admin/policy-types" className="navbar-link">Policy Types</Link>
                <Link to="/admin/users" className="navbar-link">Users</Link>
                <Link to="/admin/policies" className="navbar-link">View Policies</Link>
                <Link to="/admin/claims" className="navbar-link">View Claims</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                <Link to="/calculator" className="navbar-link">Calculator</Link>
                <Link to="/buy-policy" className="navbar-link">Buy Policy</Link>
                <Link to="/policies" className="navbar-link">My Policies</Link>
                <Link to="/submit-claim" className="navbar-link">Submit Claim</Link>
                <Link to="/claims" className="navbar-link">My Claims</Link>
              </>
            )}
            
            <div className="navbar-user">
              <button 
                className="theme-toggle" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <div className="profile-dropdown">
                <button 
                  className="profile-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const dropdown = e.currentTarget.nextElementSibling;
                    const isOpen = dropdown?.classList.contains('show');
                    // Close all dropdowns
                    document.querySelectorAll('.profile-dropdown-menu').forEach(menu => {
                      menu.classList.remove('show');
                    });
                    if (!isOpen) {
                      dropdown?.classList.add('show');
                    }
                  }}
                  title="Profile"
                >
                  <div className="profile-icon">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user?.name}</div>
                      <div className="profile-dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <Link 
                    to="/profile" 
                    className="profile-dropdown-item"
                    onClick={(e) => {
                      e.currentTarget.closest('.profile-dropdown-menu')?.classList.remove('show');
                    }}
                  >
                    👤 My Profile
                  </Link>
                  <div className="profile-dropdown-divider"></div>
                  <button 
                    onClick={(e) => {
                      e.currentTarget.closest('.profile-dropdown-menu')?.classList.remove('show');
                      handleLogout();
                    }} 
                    className="profile-dropdown-item profile-dropdown-logout"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

