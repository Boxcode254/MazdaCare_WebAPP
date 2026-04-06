import { Fragment, Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BottomNav } from '@/components/layout/BottomNav'
import { SplashScreen } from '@/components/layout/SplashScreen'
import { NetworkBanner } from '@/components/ui/NetworkBanner'
import { useIdleTimer } from '@/hooks/useIdleTimer'

const Auth = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.Auth })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const AddCar = lazy(() => import('@/pages/AddCar').then((m) => ({ default: m.AddCar })))
const ServiceLog = lazy(() => import('@/pages/ServiceLog').then((m) => ({ default: m.ServiceLog })))
const LogService = lazy(() => import('@/pages/LogService').then((m) => ({ default: m.LogService })))
const GarageMap = lazy(() => import('@/pages/GarageMap').then((m) => ({ default: m.GarageMap })))
const Schedule = lazy(() => import('@/pages/Schedule').then((m) => ({ default: m.Schedule })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

function PageFallback() {
  return (
    <div className="space-y-3 pt-1">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200/80" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  )
}

function ProtectedAppLayout() {
  useIdleTimer()
  const location = useLocation()
  const showBottomNav = location.pathname !== '/auth'
  const networkBannerOffsetClass =
    location.pathname === '/'
      ? 'top-[calc(env(safe-area-inset-top,0px)+104px)]'
      : 'top-[calc(env(safe-area-inset-top,0px)+88px)]'

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-white/30 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.16)] backdrop-blur">
      <NetworkBanner className={`absolute inset-x-0 z-40 ${networkBannerOffsetClass}`} />
      <main className="flex flex-col flex-1 px-4 pb-24 pt-6">
        <Suspense fallback={<PageFallback />}>
          <div key={location.pathname} className="page-enter flex flex-col flex-1">
            <Outlet />
          </div>
        </Suspense>
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  )
}

function App() {
  return (
    <Fragment>
      <SplashScreen />
      <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <Suspense fallback={<PageFallback />}>
              <Auth />
            </Suspense>
          }
        />

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
    </Fragment>
  )
}

export default App
