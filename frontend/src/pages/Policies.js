import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { policyAPI } from '../services/api';

const Policies = () => {
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
      const res = await policyAPI.getAll();
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
      <h1>My Policies</h1>
      
      {policies.length === 0 ? (
        <div className="card">
          <p>No policies found. <a href="/buy-policy">Buy your first policy</a></p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Policy Type</th>
                <th>Vehicle</th>
                <th>Premium</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Blockchain</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy._id}>
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
                  <td>
                    {policy.blockchainTxHash ? (
                      <span className="badge badge-info" title={policy.blockchainTxHash}>
                        ✓ On Chain
                      </span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Policies;

