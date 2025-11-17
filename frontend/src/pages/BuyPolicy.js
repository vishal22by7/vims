import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { policyAPI, calculatorAPI } from '../services/api';

const BuyPolicy = () => {
  const navigate = useNavigate();
  const [policyTypes, setPolicyTypes] = useState([]);
  const [formData, setFormData] = useState({
    policyTypeId: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    modelYear: new Date().getFullYear(),
    engineCapacity: '',
    startDate: '',
    endDate: '',
    addOns: [],
  });
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPolicyTypes();
  }, []);

  const fetchPolicyTypes = async () => {
    try {
      const res = await calculatorAPI.getPolicyTypes();
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
      [name]: name === 'modelYear' || name === 'engineCapacity' ? parseFloat(value) || '' : value,
    });
  };

  const calculatePremium = async () => {
    if (!formData.policyTypeId || !formData.vehicleType || !formData.engineCapacity) {
      return;
    }

    try {
      const res = await calculatorAPI.calculatePremium({
        ...formData,
        modelYear: parseInt(formData.modelYear),
      });
      if (res.data.success) {
        setPremium(res.data.calculation.finalPremium);
      }
    } catch (error) {
      console.error('Premium calculation error:', error);
    }
  };

  useEffect(() => {
    calculatePremium();
  }, [formData.policyTypeId, formData.vehicleType, formData.modelYear, formData.engineCapacity, formData.addOns]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!premium) {
      toast.error('Please fill all required fields to calculate premium');
      return;
    }

    setLoading(true);

    try {
      const res = await policyAPI.buy({
        ...formData,
        premium,
        modelYear: parseInt(formData.modelYear),
        engineCapacity: parseFloat(formData.engineCapacity),
      });

      if (res.data.success) {
        toast.success('Policy purchased successfully!');
        navigate('/policies');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to purchase policy');
    } finally {
      setLoading(false);
    }
  };

  const selectedPolicyType = policyTypes.find(pt => pt._id === formData.policyTypeId);
  const availableAddOns = selectedPolicyType?.addOns ? Object.keys(selectedPolicyType.addOns) : [];

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="container">
      <h1>Buy Insurance Policy</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2>Policy Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Policy Type *</label>
              <select
                name="policyTypeId"
                value={formData.policyTypeId}
                onChange={handleChange}
                required
              >
                <option value="">Select Policy Type</option>
                {policyTypes.map((pt) => (
                  <option key={pt._id} value={pt._id}>
                    {pt.name} - {pt.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Vehicle Type *</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
              >
                <option value="">Select Vehicle Type</option>
                <option value="Car">Car</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Van">Van</option>
              </select>
            </div>

            <div className="form-group">
              <label>Vehicle Brand *</label>
              <input
                type="text"
                name="vehicleBrand"
                value={formData.vehicleBrand}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Vehicle Model *</label>
              <input
                type="text"
                name="vehicleModel"
                value={formData.vehicleModel}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Model Year *</label>
              <input
                type="number"
                name="modelYear"
                value={formData.modelYear}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div className="form-group">
              <label>Engine Capacity (L) *</label>
              <input
                type="number"
                name="engineCapacity"
                value={formData.engineCapacity}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
              />
            </div>

            {availableAddOns.length > 0 && (
              <div className="form-group">
                <label>Add-ons</label>
                {availableAddOns.map((addOn) => (
                  <label key={addOn} style={{ display: 'block', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={formData.addOns.includes(addOn)}
                      onChange={() => {
                        const newAddOns = formData.addOns.includes(addOn)
                          ? formData.addOns.filter(a => a !== addOn)
                          : [...formData.addOns, addOn];
                        setFormData({ ...formData, addOns: newAddOns });
                      }}
                    />
                    {addOn} (+{((selectedPolicyType.addOns[addOn] * 100).toFixed(0))}%)
                  </label>
                ))}
              </div>
            )}

            <div className="form-group">
              <label>Policy Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={today}
                required
              />
            </div>

            <div className="form-group">
              <label>Policy End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || today}
                max={maxDateStr}
                required
              />
            </div>

            {premium && (
              <div className="premium-display">
                <strong>Calculated Premium: ${premium.toFixed(2)}</strong>
              </div>
            )}

            <button type="submit" className="btn btn-success" disabled={loading || !premium}>
              {loading ? 'Processing...' : 'Purchase Policy'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuyPolicy;

