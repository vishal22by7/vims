import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const AdminPolicyTypes = () => {
  const [policyTypes, setPolicyTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseRate: '',
    ageFactor: '',
    engineFactor: '',
    addOns: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPolicyTypes();
  }, []);

  const fetchPolicyTypes = async () => {
    try {
      const res = await adminAPI.getPolicyTypes();
      if (res.data.success) {
        setPolicyTypes(res.data.policyTypes);
      }
    } catch (error) {
      toast.error('Failed to load policy types');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'baseRate' || name === 'ageFactor' || name === 'engineFactor' 
        ? parseFloat(value) || '' 
        : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editing) {
        await adminAPI.updatePolicyType(editing, formData);
        toast.success('Policy type updated successfully');
      } else {
        await adminAPI.createPolicyType(formData);
        toast.success('Policy type created successfully');
      }
      fetchPolicyTypes();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      baseRate: '',
      ageFactor: '',
      engineFactor: '',
      addOns: {},
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (policyType) => {
    setEditing(policyType._id);
    setFormData({
      name: policyType.name,
      description: policyType.description,
      baseRate: policyType.baseRate,
      ageFactor: policyType.ageFactor,
      engineFactor: policyType.engineFactor,
      addOns: policyType.addOns || {},
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy type?')) {
      return;
    }

    try {
      await adminAPI.deletePolicyType(id);
      toast.success('Policy type deleted successfully');
      fetchPolicyTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete policy type');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Policy Types Management</h1>
          <p className="page-subtitle">Create and manage insurance policy types</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Policy Type
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editing ? 'Edit' : 'Create'} Policy Type</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Base Rate *</label>
              <input
                type="number"
                name="baseRate"
                value={formData.baseRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Age Factor *</label>
              <input
                type="number"
                name="ageFactor"
                value={formData.ageFactor}
                onChange={handleChange}
                min="0"
                step="0.001"
                required
              />
            </div>
            <div className="form-group">
              <label>Engine Factor *</label>
              <input
                type="number"
                name="engineFactor"
                value={formData.engineFactor}
                onChange={handleChange}
                min="0"
                step="0.001"
                required
              />
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ marginLeft: '10px' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {policyTypes.length === 0 ? (
          <div className="empty-state">
            <p>No policy types found. Create your first policy type to get started.</p>
          </div>
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Base Rate</th>
              <th>Age Factor</th>
              <th>Engine Factor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policyTypes.map((pt) => (
              <tr key={pt._id}>
                <td>{pt.name}</td>
                <td>{pt.description}</td>
                <td>${pt.baseRate.toFixed(2)}</td>
                <td>{pt.ageFactor}</td>
                <td>{pt.engineFactor}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(pt)}
                    style={{ marginRight: '5px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(pt._id)}
                  >
                    Delete
                  </button>
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

export default AdminPolicyTypes;

