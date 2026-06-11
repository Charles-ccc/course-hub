import { Navigate, Outlet } from "react-router-dom";
import type { ReactElement } from "react";
import { getToken } from "../auth/session";

export const ProtectedRoute = (): ReactElement => {
  const token = getToken();
  if (!token) {
    return <Navigate to='/login' replace />;
  }
  return <Outlet />;
};

export const PublicRoute = (): ReactElement => {
  const token = getToken();
  if (token) {
    return <Navigate to='/dashboard' replace />;
  }
  return <Outlet />;
};
