import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const AdminClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await adminAPI.getClaims();
      if (res.data.success) {
        setClaims(res.data.claims);
      }
    } catch (error) {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (claimId, newStatus) => {
    setUpdating(claimId);
    try {
      const res = await adminAPI.updateClaimStatus(claimId, newStatus);
      if (res.data.success) {
        toast.success(`Claim status updated to ${newStatus}`);
        fetchClaims();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update claim status');
    } finally {
      setUpdating(null);
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

  const getNextStatus = (currentStatus) => {
    const transitions = {
      'Submitted': ['In Review'],
      'In Review': ['Approved', 'Rejected'],
      'Approved': [],
      'Rejected': [],
    };
    return transitions[currentStatus] || [];
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>View Claims</h1>
        <p className="page-subtitle">Review and manage all insurance claims</p>
      </div>
      
      <div className="card">
        {claims.length === 0 ? (
          <div className="empty-state">
            <p>No claims found in the system yet.</p>
          </div>
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Policy</th>
              <th>Description</th>
              <th>Status</th>
              <th>Photos</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => {
              const nextStatuses = getNextStatus(claim.status);
              return (
                <tr key={claim._id}>
                  <td>
                    {claim.userId?.name}
                    <br />
                    <small>{claim.userId?.email}</small>
                  </td>
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
                  <td>
                    {claim.photos && claim.photos.length > 0 ? (
                      <div>
                        {claim.photos.map((photo, idx) => (
                          <a
                            key={idx}
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block', marginBottom: '5px' }}
                          >
                            Photo {idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span>No photos</span>
                    )}
                  </td>
                  <td>{new Date(claim.submittedAt).toLocaleDateString()}</td>
                  <td>
                    {nextStatuses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {nextStatuses.map((status) => (
                          <button
                            key={status}
                            className={`btn btn-sm ${status === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => handleStatusUpdate(claim._id, status)}
                            disabled={updating === claim._id}
                          >
                            {updating === claim._id ? 'Updating...' : `Mark as ${status}`}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="badge badge-secondary">No actions</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default AdminClaims;

