import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import AddBooks from './components/AddBook';
import ListBooks from './components/BookList';
import Orders from './components/Orders';
import Users from './components/Users';
import ChatBot from './components/ChatBot';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import AdminLogin from './components/AdminLogin';
import Toastify from './components/Toastify';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      {isAuthenticated ? (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)}
          />
          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'md:ml-64'}`}>
            <Routes>
              <Route path="/add-books" element={<AddBooks />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/list-books" element={<ListBooks />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/chatbot" element={<ChatBot />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toastify />
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;