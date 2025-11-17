import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { claimAPI } from '../services/api';

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await claimAPI.getAll();
      if (res.data.success) {
        setClaims(res.data.claims);
      }
    } catch (error) {
      toast.error('Failed to load claims');
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

  return (
    <div className="container">
      <h1>My Claims</h1>
      
      {claims.length === 0 ? (
        <div className="card">
          <p>No claims found. <a href="/submit-claim">Submit your first claim</a></p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Description</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Photos</th>
                <th>Blockchain</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim._id}>
                  <td>
                    {claim.policyId?.vehicleBrand} {claim.policyId?.vehicleModel}
                    <br />
                    <small>{claim.policyId?.policyTypeId?.name || 'N/A'}</small>
                  </td>
                  <td>{claim.description.substring(0, 100)}...</td>
                  <td>
                    <span className={`badge ${getStatusBadge(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td>{new Date(claim.submittedAt).toLocaleDateString()}</td>
                  <td>
                    {claim.photos && claim.photos.length > 0 ? (
                      <span>{claim.photos.length} photo(s)</span>
                    ) : (
                      <span>No photos</span>
                    )}
                  </td>
                  <td>
                    {claim.blockchainTxHash ? (
                      <span className="badge badge-info" title={claim.blockchainTxHash}>
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

export default Claims;

