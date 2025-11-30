import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { userAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    password: '',
    currentPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.data.success) {
        const user = res.data.user;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            pincode: user.address?.pincode || ''
          },
          password: '',
          currentPassword: ''
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address
      };

      // Only include password fields if password is being changed
      if (formData.password) {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }

      const res = await userAPI.updateProfile(updateData);
      if (res.data.success) {
        toast.success('Profile updated successfully!');
        updateUser(res.data.user);
        setEditing(false);
        setFormData({
          ...formData,
          password: '',
          currentPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchProfile();
  };

  return (
    <div className="container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p className="profile-subtitle">Manage your personal information and account settings</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-avatar-info">
              <h2>{formData.name || 'User'}</h2>
              <p>{formData.email}</p>
            </div>
            {!editing && (
              <button 
                className="btn btn-primary" 
                onClick={() => setEditing(true)}
                style={{ marginLeft: 'auto' }}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="profile-section">
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#666', fontSize: '0.85em' }}>
                    Email cannot be changed
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                  <small style={{ color: '#666', fontSize: '0.85em' }}>
                    Enter 10-digit mobile number
                  </small>
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!editing}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Address</h3>
              
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="House/Flat number, Street name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="City"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="State"
                  />
                </div>

                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Change Password</h3>
              <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginBottom: '15px' }}>
                Leave blank if you don't want to change your password
              </small>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <small style={{ color: '#666', fontSize: '0.85em' }}>
                    Minimum 6 characters
                  </small>
                </div>
              </div>
            </div>

            {editing && (
              <div className="profile-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

