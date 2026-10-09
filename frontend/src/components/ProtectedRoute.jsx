// src/components/ProtectedRoute.jsx
// Защита маршрутов: пока сессия проверяется на сервере (isReady), не переносим на /login

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ children }) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <Loader text="Проверяем вашу сессию..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
