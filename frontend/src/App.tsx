import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import Layout from './components/shared/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Nurse Routes */}
              <Route path="nurse">
                <Route path="patients" element={<div>Patient Management</div>} />
                <Route path="visits" element={<div>Visit Management</div>} />
                <Route path="forms" element={<div>Nurse Forms</div>} />
              </Route>

              {/* Doctor Routes */}
              <Route path="doctor">
                <Route path="cases" element={<div>Cases</div>} />
                <Route path="reviews" element={<div>Case Reviews</div>} />
                <Route path="forms" element={<div>Doctor Forms</div>} />
              </Route>

              {/* Admin Routes */}
              <Route path="admin">
                <Route path="users" element={<div>User Management</div>} />
                <Route path="monitoring" element={<div>System Monitoring</div>} />
                <Route path="audit-logs" element={<div>Audit Logs</div>} />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;