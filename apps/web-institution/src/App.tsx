import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/login/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CoursesPage from './pages/courses/CoursesPage'
import OrdersPage from './pages/orders/OrdersPage'
import SettlementPage from './pages/settlement/SettlementPage'
import OverduePage from './pages/overdue/OverduePage'
import QaPage from './pages/qa/QaPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to='/login' replace />
}

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/' element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to='/dashboard' replace />} />
        <Route path='dashboard' element={<DashboardPage />} />
        <Route path='courses' element={<CoursesPage />} />
        <Route path='orders' element={<OrdersPage />} />
        <Route path='settlement' element={<SettlementPage />} />
        <Route path='overdue' element={<OverduePage />} />
        <Route path='qa' element={<QaPage />} />
      </Route>
    </Routes>
  )
}
