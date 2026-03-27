// src/components/ProtectedRoute/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // however you track login; here we just look for a token
  const token = localStorage.getItem('authToken');
  const location = useLocation();

  if (!token) {
    // redirect to /login, preserving where they came from
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // logged in — render the protected page
  return children;
};

export default ProtectedRoute;
