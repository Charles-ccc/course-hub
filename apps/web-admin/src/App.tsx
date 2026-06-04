import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdminAuthStore } from './store/auth'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/login/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import OrgsPage from './pages/orgs/OrgsPage'
import StaffPage from './pages/staff/StaffPage'
import ConfigPage from './pages/config/ConfigPage'
import ReportPage from './pages/report/ReportPage'
import SettlementPage from './pages/settlement/SettlementPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAdminAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to='/login' replace />
}

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/' element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route index element={<Navigate to='/dashboard' replace />} />
        <Route path='dashboard' element={<DashboardPage />} />
        <Route path='orgs' element={<OrgsPage />} />
        <Route path='staff' element={<StaffPage />} />
        <Route path='config' element={<ConfigPage />} />
        <Route path='report' element={<ReportPage />} />
        <Route path='settlement' element={<SettlementPage />} />
      </Route>
    </Routes>
  )
}
