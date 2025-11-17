import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { policyAPI, claimAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);

  const fetchData = async () => {
    try {
      const [policiesRes, claimsRes] = await Promise.all([
        policyAPI.getAll(),
        claimAPI.getAll(),
      ]);

      if (policiesRes.data.success) {
        setPolicies(policiesRes.data.policies);
      }
      if (claimsRes.data.success) {
        setClaims(claimsRes.data.claims);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Submitted': 'badge-warning',
      'In Review': 'badge-info',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect admin to admin dashboard (after hooks run)
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="container">
      <h1>Welcome, {user?.name}!</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{policies.length}</h3>
          <p>Active Policies</p>
        </div>
        <div className="stat-card">
          <h3>{claims.length}</h3>
          <p>Total Claims</p>
        </div>
        <div className="stat-card">
          <h3>{claims.filter(c => c.status === 'Approved').length}</h3>
          <p>Approved Claims</p>
        </div>
        <div className="stat-card">
          <h3>{claims.filter(c => c.status === 'Submitted' || c.status === 'In Review').length}</h3>
          <p>Pending Claims</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Recent Policies</h2>
            <Link to="/policies" className="btn btn-primary btn-sm">View All</Link>
          </div>
          {policies.length === 0 ? (
            <p>No policies yet. <Link to="/buy-policy">Buy your first policy</Link></p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Policy Type</th>
                    <th>Vehicle</th>
                    <th>Premium</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.slice(0, 5).map((policy) => (
                    <tr key={policy._id}>
                      <td>{policy.policyTypeId?.name || 'N/A'}</td>
                      <td>{policy.vehicleBrand} {policy.vehicleModel} ({policy.modelYear})</td>
                      <td>{formatCurrency(policy.premium)}</td>
                      <td>
                        <span className={`badge ${new Date(policy.endDate) > new Date() ? 'badge-success' : 'badge-danger'}`}>
                          {new Date(policy.endDate) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recent Claims</h2>
            <Link to="/claims" className="btn btn-primary btn-sm">View All</Link>
          </div>
          {claims.length === 0 ? (
            <p>No claims yet. <Link to="/submit-claim">Submit your first claim</Link></p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.slice(0, 5).map((claim) => (
                    <tr key={claim._id}>
                      <td>{claim.description.substring(0, 50)}...</td>
                      <td>
                        <span className={`badge ${getStatusBadge(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td>{new Date(claim.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/calculator" className="btn btn-primary">Calculate Premium</Link>
        <Link to="/buy-policy" className="btn btn-success">Buy Policy</Link>
        <Link to="/submit-claim" className="btn btn-secondary">Submit Claim</Link>
      </div>
    </div>
  );
};

export default Dashboard;

