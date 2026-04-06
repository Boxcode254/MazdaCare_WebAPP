import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BottomNav } from '@/components/layout/BottomNav'
import { AddCar } from '@/pages/AddCar'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { GarageMap } from '@/pages/GarageMap'
import { LogService } from '@/pages/LogService'
import { Schedule } from '@/pages/Schedule'
import { ServiceLog } from '@/pages/ServiceLog'
import { Settings } from '@/pages/Settings'

function ProtectedAppLayout() {
  const location = useLocation()
  const showBottomNav = location.pathname !== '/auth'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-lg">
      <main className="flex-1 px-4 pb-24 pt-6">
        <Outlet />
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route
          element={
            <ProtectedRoute>
              <ProtectedAppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-car" element={<AddCar />} />
          <Route path="/service/:vehicleId" element={<ServiceLog />} />
          <Route path="/log-service/:vehicleId" element={<LogService />} />
          <Route path="/map" element={<GarageMap />} />
          <Route path="/schedule/:vehicleId" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
