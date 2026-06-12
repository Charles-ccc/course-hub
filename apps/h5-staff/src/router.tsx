/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Spin } from "antd";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";
import { AppLayout } from "./layouts/AppLayout";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const StudentsPage = lazy(() =>
  import("./pages/StudentsPage").then((module) => ({
    default: module.StudentsPage,
  })),
);
const CommissionsPage = lazy(() =>
  import("./pages/CommissionsPage").then((module) => ({
    default: module.CommissionsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);

const withSuspense = (node: ReactNode): ReactNode => (
  <Suspense
    fallback={
      <div style={{ display: "grid", placeItems: "center", minHeight: 220 }}>
        <Spin size='large' />
      </div>
    }
  >
    {node}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: withSuspense(<LoginPage />),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to='/home' replace /> },
          { path: "/home", element: withSuspense(<HomePage />) },
          { path: "/students", element: withSuspense(<StudentsPage />) },
          {
            path: "/commissions",
            element: withSuspense(<CommissionsPage />),
          },
          { path: "/profile", element: withSuspense(<ProfilePage />) },
        ],
      },
    ],
  },
]);
