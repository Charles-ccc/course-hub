import { Navigate, Outlet } from "react-router-dom";
import type { ReactElement } from "react";
import { getSession, getToken } from "../auth/session";

export const ProtectedRoute = (): ReactElement => {
  const token = getToken();
  const session = getSession();
  if (!token || !session?.staffId) {
    return <Navigate to='/login' replace />;
  }
  return <Outlet />;
};

export const PublicRoute = (): ReactElement => {
  const token = getToken();
  const session = getSession();
  if (token && session?.staffId) {
    return <Navigate to='/home' replace />;
  }
  return <Outlet />;
};
