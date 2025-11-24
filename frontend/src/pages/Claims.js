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

  const handleDelete = async (claimId) => {
    if (!window.confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
      return;
    }

    try {
      await claimAPI.delete(claimId);
      toast.success('Claim deleted successfully');
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete claim');
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
                <th>ML Analysis</th>
                <th>Blockchain</th>
                <th>Payout</th>
                <th>Submitted</th>
                <th>Actions</th>
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
                  <td>{claim.description.substring(0, 80)}...</td>
                  <td>
                    <span className={`badge ${getStatusBadge(claim.status)}`}>
                      {claim.status}
                    </span>
                    {claim.verified && (
                      <span className="badge badge-success" style={{ marginLeft: '5px' }}>
                        ✓ Verified
                      </span>
                    )}
                  </td>
                  <td>
                    {claim.mlSeverity !== null && claim.mlSeverity !== undefined ? (
                      <div>
                        <div>
                          <strong>Severity:</strong> {claim.mlSeverity.toFixed(1)}/100
                          <div style={{ 
                            width: '60px', 
                            height: '8px', 
                            backgroundColor: '#e0e0e0', 
                            borderRadius: '4px',
                            marginTop: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${claim.mlSeverity}%`,
                              height: '100%',
                              backgroundColor: claim.mlSeverity >= 60 ? '#4caf50' : claim.mlSeverity >= 40 ? '#ff9800' : '#f44336'
                            }} />
                          </div>
                        </div>
                        {claim.damageParts && claim.damageParts.length > 0 && (
                          <small style={{ fontSize: '11px', color: '#666' }}>
                            {claim.damageParts.join(', ')}
                          </small>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-secondary">Pending</span>
                    )}
                  </td>
                  <td>
                    {claim.blockchainTxHash ? (
                      <div>
                        <span className="badge badge-info" title={claim.blockchainTxHash}>
                          ✓ On Chain
                        </span>
                        {claim.blockchainEvaluated && (
                          <>
                            <br />
                            <small style={{ fontSize: '10px', color: '#666' }}>
                              Evaluated
                            </small>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                  <td>
                    {claim.payoutAmount > 0 ? (
                      <div>
                        <strong>₹{new Intl.NumberFormat('en-IN').format(claim.payoutAmount)}</strong>
                        <br />
                        <small className={`badge ${claim.payoutStatus === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                          {claim.payoutStatus}
                        </small>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>{new Date(claim.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(claim._id)}
                      title="Delete Claim"
                      disabled={claim.status === 'Approved'}
                    >
                      Delete
                    </button>
                    {claim.status === 'Approved' && (
                      <small style={{ display: 'block', fontSize: '10px', color: '#666', marginTop: '4px' }}>
                        Cannot delete approved claims
                      </small>
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

