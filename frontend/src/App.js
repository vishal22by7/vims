import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PremiumCalculator from './pages/PremiumCalculator';
import BuyPolicy from './pages/BuyPolicy';
import Policies from './pages/Policies';
import SubmitClaim from './pages/SubmitClaim';
import Claims from './pages/Claims';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPolicyTypes from './pages/admin/AdminPolicyTypes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPolicies from './pages/admin/AdminPolicies';
import AdminClaims from './pages/admin/AdminClaims';
import Navbar from './components/Navbar';
import ToastContainerWrapper from './components/ToastContainerWrapper';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = React.useContext(AuthContext);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = React.useContext(AuthContext);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            {/* Redirect /admin to /admin if admin tries to access /dashboard */}
            <Route
              path="/calculator"
              element={
                <PrivateRoute>
                  <PremiumCalculator />
                </PrivateRoute>
              }
            />
            <Route
              path="/buy-policy"
              element={
                <PrivateRoute>
                  <BuyPolicy />
                </PrivateRoute>
              }
            />
            <Route
              path="/policies"
              element={
                <PrivateRoute>
                  <Policies />
                </PrivateRoute>
              }
            />
            <Route
              path="/submit-claim"
              element={
                <PrivateRoute>
                  <SubmitClaim />
                </PrivateRoute>
              }
            />
            <Route
              path="/claims"
              element={
                <PrivateRoute>
                  <Claims />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/policy-types"
              element={
                <AdminRoute>
                  <AdminPolicyTypes />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/policies"
              element={
                <AdminRoute>
                  <AdminPolicies />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/claims"
              element={
                <AdminRoute>
                  <AdminClaims />
                </AdminRoute>
              }
            />
            
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
          <ToastContainerWrapper />
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

