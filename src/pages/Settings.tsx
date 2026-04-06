import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, ChevronLeft, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/stores/appStore'
import { toast } from 'sonner'

export function Settings() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const user = useAppStore((s) => s.user)

  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [signingOut, setSigningOut] = useState(false)

  const displayName: string =
    user?.user_metadata?.full_name ?? user?.email ?? 'Unknown user'
  const email = user?.email ?? ''

  async function handleToggleNotifications() {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.')
      return
    }
    if (notifEnabled) {
      // Can't programmatically revoke; guide user
      toast.info('To disable notifications, revoke permission in browser site settings.')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setNotifEnabled(true)
      toast.success('Notifications enabled!')
    } else {
      toast.error('Permission denied. Enable in browser settings.')
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/auth', { replace: true })
    } catch {
      toast.error('Sign out failed. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      </div>

      {/* Profile */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <User className="h-6 w-6 text-[#C00000]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <div className="space-y-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Preferences
        </p>

        {/* Notifications toggle */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between pt-4 pb-4">
            <div className="flex items-center gap-3">
              {notifEnabled ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-slate-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-800">Service reminders</p>
                <p className="text-xs text-slate-500">
                  {notifEnabled ? 'Notifications enabled' : 'Notifications off'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle notifications"
              role="switch"
              aria-checked={notifEnabled}
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                notifEnabled ? 'bg-green-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  notifEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </CardContent>
        </Card>

        {/* Mileage unit (display only — km is fixed for Kenya) */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between pt-4 pb-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Mileage unit</p>
              <p className="text-xs text-slate-500">Fixed to km for Kenya</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              km
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </Button>

      <p className="text-center text-xs text-slate-300">MazdaCare v0.1.0</p>
    </div>
  )
}
