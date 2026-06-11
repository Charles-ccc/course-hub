/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Spin } from "antd";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./components/RouteGuards";
import { AppLayout } from "./layouts/AppLayout";
const InsitutionsPage = lazy(() =>
  import("./pages/InsitutionsPage").then((module) => ({
    default: module.InsitutionsPage,
  })),
);
const SalesmenPage = lazy(() =>
  import("./pages/SalesmenPage").then((module) => ({
    default: module.SalesmenPage,
  })),
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((module) => ({
    default: module.ReportsPage,
  })),
);
const SystemConfigPage = lazy(() =>
  import("./pages/SystemConfigPage").then((module) => ({
    default: module.SystemConfigPage,
  })),
);

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const CoursesPage = lazy(() =>
  import("./pages/CoursesPage").then((module) => ({
    default: module.CoursesPage,
  })),
);
const SettlementsPage = lazy(() =>
  import("./pages/SettlementsPage").then((module) => ({
    default: module.SettlementsPage,
  })),
);

const withSuspense = (node: ReactNode): ReactNode => (
  <Suspense
    fallback={
      <div style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
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
          { path: "/", element: <Navigate to='/dashboard' replace /> },
          { path: "/dashboard", element: withSuspense(<DashboardPage />) },
          {
            path: "/insitutions",
            element: withSuspense(<InsitutionsPage />),
          },
          { path: "/courses", element: withSuspense(<CoursesPage />) },
          { path: "/salesmen", element: withSuspense(<SalesmenPage />) },
          { path: "/reports", element: withSuspense(<ReportsPage />) },
          { path: "/settlements", element: withSuspense(<SettlementsPage />) },
          {
            path: "/system-config",
            element: withSuspense(<SystemConfigPage />),
          },
        ],
      },
    ],
  },
]);
