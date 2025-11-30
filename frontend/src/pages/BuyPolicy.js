import React, { useState, useEffect, useCallback } from 'react';
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
    registrationNumber: '',
    chassisNumber: '',
    startDate: '',
    endDate: '',
    addOns: [],
  });
  const [documents, setDocuments] = useState({
    rcDocument: null,
    insuranceDocument: null,
    drivingLicense: null,
  });
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
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
    // Validate chassis number (17 chars, no I, O, Q)
    if (name === 'chassisNumber') {
      const cleaned = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
      setFormData({
        ...formData,
        [name]: cleaned,
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'modelYear' || name === 'engineCapacity' ? parseFloat(value) || '' : value,
      });
    }
  };

  const handleDocumentChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setDocuments({
        ...documents,
        [name]: file,
      });
    }
  };

  const calculatePremium = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.policyTypeId, formData.vehicleType, formData.modelYear, formData.engineCapacity, formData.addOns]);

  useEffect(() => {
    calculatePremium();
  }, [calculatePremium]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!premium) {
      toast.error('Please fill all required fields to calculate premium');
      return;
    }

    // Validate chassis number
    if (formData.chassisNumber.length !== 17) {
      toast.error('Chassis number must be exactly 17 characters');
      return;
    }

    // Validate chassis number format (no I, O, Q)
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinPattern.test(formData.chassisNumber.toUpperCase())) {
      toast.error('Invalid chassis number format. Cannot contain I, O, or Q');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('policyTypeId', formData.policyTypeId);
      formDataToSend.append('vehicleType', formData.vehicleType);
      formDataToSend.append('vehicleBrand', formData.vehicleBrand);
      formDataToSend.append('vehicleModel', formData.vehicleModel);
      formDataToSend.append('modelYear', parseInt(formData.modelYear));
      formDataToSend.append('engineCapacity', parseFloat(formData.engineCapacity));
      formDataToSend.append('registrationNumber', formData.registrationNumber.toUpperCase().trim());
      formDataToSend.append('chassisNumber', formData.chassisNumber.toUpperCase().trim());
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('premium', premium);
      formDataToSend.append('addOns', JSON.stringify(formData.addOns));

      // Append documents if uploaded
      if (documents.rcDocument) {
        formDataToSend.append('rcDocument', documents.rcDocument);
      }
      if (documents.insuranceDocument) {
        formDataToSend.append('insuranceDocument', documents.insuranceDocument);
      }
      if (documents.drivingLicense) {
        formDataToSend.append('drivingLicense', documents.drivingLicense);
      }

      const res = await policyAPI.buy(formDataToSend);

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
      <div className="page-header">
        <div>
          <h1>Buy Insurance Policy</h1>
          <p className="page-subtitle">Get comprehensive vehicle insurance coverage in minutes</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Vehicle & Policy Information</h2>
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

            <div className="form-group">
              <label>Vehicle Registration Number *</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g., MH12AB1234"
                style={{ textTransform: 'uppercase' }}
                required
              />
              <small style={{ color: '#666', fontSize: '0.9em' }}>
                Enter your vehicle's official registration number
              </small>
            </div>

            <div className="form-group">
              <label>Chassis Number (VIN) *</label>
              <input
                type="text"
                name="chassisNumber"
                value={formData.chassisNumber}
                onChange={handleChange}
                placeholder="e.g., MAH1A2B3C4D5E6F7G"
                style={{ textTransform: 'uppercase' }}
                maxLength={17}
                pattern="[A-HJ-NPR-Z0-9]{17}"
                required
              />
              <small style={{ color: '#666', fontSize: '0.9em' }}>
                Enter 17-character VIN (alphanumeric, no I, O, Q). Example: MAH1A2B3C4D5E6F7G
              </small>
              {formData.chassisNumber && formData.chassisNumber.length !== 17 && (
                <small style={{ color: '#dc3545', fontSize: '0.9em', display: 'block', marginTop: '4px' }}>
                  Chassis number must be exactly 17 characters
                </small>
              )}
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

            <div className="form-group" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>📄 Required Documents</h3>
              
              <div className="form-group">
                <label>RC (Registration Certificate) *</label>
                <input
                  type="file"
                  name="rcDocument"
                  onChange={handleDocumentChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                />
                <small style={{ color: '#666', fontSize: '0.9em' }}>
                  Upload your vehicle's RC document (JPG, PNG, or PDF, max 5MB)
                </small>
                {documents.rcDocument && (
                  <div style={{ marginTop: '8px', color: '#28a745', fontSize: '0.9em' }}>
                    ✓ {documents.rcDocument.name}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Previous Insurance Document (if any)</label>
                <input
                  type="file"
                  name="insuranceDocument"
                  onChange={handleDocumentChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                <small style={{ color: '#666', fontSize: '0.9em' }}>
                  Upload previous insurance policy document (optional)
                </small>
                {documents.insuranceDocument && (
                  <div style={{ marginTop: '8px', color: '#28a745', fontSize: '0.9em' }}>
                    ✓ {documents.insuranceDocument.name}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Driving License</label>
                <input
                  type="file"
                  name="drivingLicense"
                  onChange={handleDocumentChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                <small style={{ color: '#666', fontSize: '0.9em' }}>
                  Upload your driving license (optional)
                </small>
                {documents.drivingLicense && (
                  <div style={{ marginTop: '8px', color: '#28a745', fontSize: '0.9em' }}>
                    ✓ {documents.drivingLicense.name}
                  </div>
                )}
              </div>
            </div>

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
                <strong>Calculated Premium: {formatCurrency(premium)}</strong>
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

