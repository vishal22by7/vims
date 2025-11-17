import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getDashboard();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Welcome back, {user?.name}</p>
        </div>
        <div className="admin-role-badge">
          <span className="badge badge-info">Administrator</span>
        </div>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <h3>{stats?.totalUsers || 0}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">📄</div>
          <h3>{stats?.totalPolicies || 0}</h3>
          <p>Total Policies</p>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">📋</div>
          <h3>{stats?.totalClaims || 0}</h3>
          <p>Total Claims</p>
        </div>
        <div className="stat-card stat-card-danger">
          <div className="stat-icon">⏳</div>
          <h3>{stats?.pendingClaims || 0}</h3>
          <p>Pending Claims</p>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">🔍</div>
          <h3>{stats?.inReviewClaims || 0}</h3>
          <p>In Review</p>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/admin/policy-types" className="action-card">
            <div className="action-icon">⚙️</div>
            <h3>Manage Policy Types</h3>
            <p>Create and manage insurance policy types</p>
          </Link>
          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👤</div>
            <h3>View Users</h3>
            <p>View and manage all registered users</p>
          </Link>
          <Link to="/admin/policies" className="action-card">
            <div className="action-icon">📑</div>
            <h3>View Policies</h3>
            <p>View all insurance policies in the system</p>
          </Link>
          <Link to="/admin/claims" className="action-card action-card-primary">
            <div className="action-icon">✅</div>
            <h3>Review Claims</h3>
            <p>Review and process insurance claims</p>
            {stats?.pendingClaims > 0 && (
              <span className="notification-badge">{stats.pendingClaims}</span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

