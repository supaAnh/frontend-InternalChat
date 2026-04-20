import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Mainpage from './pages/mainpage/Mainpage';
import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/admin/Dashboard';

// --- HÀM KIỂM TRA TOKEN HỢP LỆ VÀ CÒN HẠN ---
const isTokenValid = () => {
  const token = sessionStorage.getItem('token'); 
  if (!token) return false;

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64); 
    const decoded = JSON.parse(decodedJson);
    
    const expTime = decoded.exp * 1000;
    
    if (Date.now() >= expTime) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Token đã hết hạn hoặc không hợp lệ: ', error);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return false;
  }
};

// 1. Component bảo vệ Mainpage
const ProtectedRoute = ({ children }) => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  if (isTokenValid()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Route bảo vệ dành riêng cho Admin
const AdminRoute = ({ children }) => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return children; // Quyền truy cập chi tiết sẽ được kiểm tra bên trong Dashboard.jsx
};

const GlobalAuthListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = () => {
      // Gọi hàm kiểm tra hạn token
      if (!isTokenValid()) {
        navigate('/login');
      }
    };

    // Kiểm tra ngay khi component mount

    window.addEventListener('storage', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, [navigate]);

  return null; 
};

function App() {
  return (
    <Router>
      <GlobalAuthListener />
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Mainpage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;