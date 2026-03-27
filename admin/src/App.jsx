import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AddBooks from './components/AddBook';
import ListBooks from './components/BookList';
import Orders from './components/Orders';
import Users from './components/Users';
import ChatBot from './components/ChatBot';
import Dashboard from './components/Dashboard';
import Toastify from './components/Toastify';

const App = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>  
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<AddBooks />} />
          <Route path="/list-books" element={<ListBooks />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/users" element={<Users />} />
          <Route path="/chatbot" element={<ChatBot />} />
        </Routes>
        <Toastify />
      </main>
    </div>
  );
};

export default App;