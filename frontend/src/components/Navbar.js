import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              <span className="navbar-username">
                {user?.name}
                {user?.role === 'admin' && <span className="admin-badge">Admin</span>}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

