// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TodosProvider } from './contexts/TodosContext';
import { ChoresProvider } from './contexts/ChoresContext';
import LoginPage from './components/auth/LoginPage';
import OAuthCallback from './components/auth/OAuthCallback';
import FamilySetup from './components/auth/FamilySetup';
import Dashboard from './components/layout/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Family setup route */}
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute>
                <FamilySetup />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <TodosProvider>
                  <ChoresProvider>
                    <Dashboard />
                  </ChoresProvider>
                </TodosProvider>
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;