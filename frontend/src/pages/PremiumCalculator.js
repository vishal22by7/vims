import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { calculatorAPI } from '../services/api';

const PremiumCalculator = () => {
  const [policyTypes, setPolicyTypes] = useState([]);
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    modelYear: new Date().getFullYear(),
    engineCapacity: '',
    policyTypeId: '',
    addOns: [],
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value || 0);

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

  const handleAddOnChange = (addOn) => {
    setFormData({
      ...formData,
      addOns: formData.addOns.includes(addOn)
        ? formData.addOns.filter(a => a !== addOn)
        : [...formData.addOns, addOn],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await calculatorAPI.calculatePremium(formData);
      if (res.data.success) {
        setResult(res.data.calculation);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedPolicyType = policyTypes.find(pt => pt._id === formData.policyTypeId);
  const availableAddOns = selectedPolicyType?.addOns ? Object.keys(selectedPolicyType.addOns) : [];

  return (
    <div className="container">
      <h1>Premium Calculator</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2>Calculate Premium</h2>
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
                      onChange={() => handleAddOnChange(addOn)}
                    />
                    {addOn} (+{((selectedPolicyType.addOns[addOn] * 100).toFixed(0))}%)
                  </label>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Premium'}
            </button>
          </form>
        </div>

        {result && (
          <div className="card">
            <h2>Calculation Result</h2>
            <div className="calculation-result">
              <div className="result-row">
                <span>Base Premium:</span>
                <strong>{formatCurrency(result.basePremium)}</strong>
              </div>
              {result.totalAddOnCost > 0 && (
                <>
                  <div className="result-row">
                    <span>Add-ons:</span>
                    <strong>{formatCurrency(result.totalAddOnCost)}</strong>
                  </div>
                  {Object.entries(result.addOnCosts).map(([addOn, cost]) => (
                    <div key={addOn} className="result-row sub-item">
                      <span>{addOn}:</span>
                      <span>{formatCurrency(cost)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="result-row total">
                <span>Final Premium:</span>
                <strong>{formatCurrency(result.finalPremium)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumCalculator;

