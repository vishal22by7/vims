import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const AdminPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);

  const fetchPolicies = async () => {
    try {
      const res = await adminAPI.getPolicies();
      if (res.data.success) {
        setPolicies(res.data.policies);
      }
    } catch (error) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>View Policies</h1>
        <p className="page-subtitle">View and manage all insurance policies in the system</p>
      </div>
      
      <div className="card">
        {policies.length === 0 ? (
          <div className="empty-state">
            <p>No policies found in the system yet.</p>
          </div>
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Policy Type</th>
              <th>Vehicle</th>
              <th>Premium</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy._id}>
                <td>
                  {policy.userId?.name}
                  <br />
                  <small>{policy.userId?.email}</small>
                </td>
                <td>{policy.policyTypeId?.name || 'N/A'}</td>
                <td>
                  {policy.vehicleBrand} {policy.vehicleModel} ({policy.modelYear})
                  <br />
                  <small>{policy.vehicleType} - {policy.engineCapacity}L</small>
                </td>
                <td>{formatCurrency(policy.premium)}</td>
                <td>{new Date(policy.startDate).toLocaleDateString()}</td>
                <td>{new Date(policy.endDate).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${new Date(policy.endDate) > new Date() ? 'badge-success' : 'badge-danger'}`}>
                    {new Date(policy.endDate) > new Date() ? 'Active' : 'Expired'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default AdminPolicies;

