import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../context/useAuth";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) return <p className="loading">Loading</p>;
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}