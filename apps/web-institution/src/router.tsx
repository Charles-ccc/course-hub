/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Spin } from "antd";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./components/RouteGuards";
import { AppLayout } from "./layouts/AppLayout";

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
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((module) => ({
    default: module.OrdersPage,
  })),
);
const OverduePage = lazy(() =>
  import("./pages/OverduePage").then((module) => ({
    default: module.OverduePage,
  })),
);
const SettlementsPage = lazy(() =>
  import("./pages/SettlementsPage").then((module) => ({
    default: module.SettlementsPage,
  })),
);
const QaPage = lazy(() =>
  import("./pages/QaPage").then((module) => ({ default: module.QaPage })),
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
          { path: "/courses", element: withSuspense(<CoursesPage />) },
          { path: "/orders", element: withSuspense(<OrdersPage />) },
          { path: "/overdue", element: withSuspense(<OverduePage />) },
          { path: "/settlements", element: withSuspense(<SettlementsPage />) },
          { path: "/qa", element: withSuspense(<QaPage />) },
        ],
      },
    ],
  },
]);
