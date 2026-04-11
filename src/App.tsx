import { Fragment, Suspense, lazy, useCallback, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Phase4Shell } from '@/components/layout/Phase4Shell'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

const Auth = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.Auth })))
const VehiclesPage = lazy(() => import('@/pages/Vehicles'))

function PageFallback() {
  return (
    <div className="space-y-3 pt-1">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200/80" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('mc_splash_shown')
    } catch {
      return false
    }
  })

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('mc_splash_shown', '1')
    } catch {
      // sessionStorage unavailable
    }
    setShowSplash(false)
  }, [])

  return (
    <ErrorBoundary>
      <Fragment>
        {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : null}
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
              path="/"
              element={
                <ProtectedRoute>
                  <Phase4Shell />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageFallback />}>
                    <VehiclesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </Fragment>
    </ErrorBoundary>
  )
}

export default App
