import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    return <Navigate to="/gestor-nlf-admin" replace />;
  }
  
  return <Outlet />;
}
