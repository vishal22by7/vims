import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { claimAPI, policyAPI } from '../services/api';

const SubmitClaim = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [formData, setFormData] = useState({
    policyId: '',
    description: '',
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await policyAPI.getAll();
      if (res.data.success) {
        // Only show active policies
        const activePolicies = res.data.policies.filter(
          p => new Date(p.endDate) > new Date()
        );
        setPolicies(activePolicies);
      }
    } catch (error) {
      toast.error('Failed to load policies');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    if (files.length + photos.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('policyId', formData.policyId);
      submitData.append('description', formData.description);
      photos.forEach((photo, index) => {
        submitData.append('photos', photo);
      });

      const res = await claimAPI.submit(submitData);
      if (res.data.success) {
        const { mlAnalysis, blockchain } = res.data;
        
        let message = 'Claim submitted successfully!';
        if (mlAnalysis) {
          message += ` ML Analysis: Severity ${mlAnalysis.severity.toFixed(1)}/100`;
        }
        if (blockchain) {
          message += ` | Blockchain: ${blockchain.txHash.substring(0, 10)}...`;
        }
        
        toast.success(message, { autoClose: 5000 });
        navigate('/claims');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Submit Insurance Claim</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Policy *</label>
            <select
              name="policyId"
              value={formData.policyId}
              onChange={handleChange}
              required
            >
              <option value="">Select Policy</option>
              {policies.map((policy) => (
                <option key={policy._id} value={policy._id}>
                  {policy.policyTypeId?.name || 'N/A'} - {policy.vehicleBrand} {policy.vehicleModel} ({policy.modelYear})
                </option>
              ))}
            </select>
            {policies.length === 0 && (
              <p className="error">No active policies found. Please purchase a policy first.</p>
            )}
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the incident..."
              required
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Photos (1-5 images, max 5MB each) *</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={handlePhotoChange}
              disabled={photos.length >= 5}
            />
            <p className="help-text">Accepted formats: JPG, PNG. Maximum 5 photos.</p>
            
            {photos.length > 0 && (
              <div className="photo-preview">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '10px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || policies.length === 0}>
            {loading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitClaim;

