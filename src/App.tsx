import { Fragment, Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BottomNav } from '@/components/layout/BottomNav'
import { SplashScreen } from '@/components/layout/SplashScreen'
import MazdaLogo from '@/components/ui/MazdaLogo'
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
  const networkBannerOffsetClass = 'top-[calc(env(safe-area-inset-top,0px)+68px)]'

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-white/50 bg-white/92 shadow-shell backdrop-blur supports-[backdrop-filter]:bg-white/82 lg:my-4 lg:min-h-[calc(100vh-2rem)] lg:overflow-hidden lg:rounded-[28px]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="flex h-[68px] items-center justify-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <MazdaLogo variant="full" theme="light" size="sm" />
        </div>
      </header>
      <NetworkBanner className={`absolute inset-x-0 z-40 ${networkBannerOffsetClass}`} />
      <main className="flex flex-col flex-1 px-4 pb-24 pt-4">
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
