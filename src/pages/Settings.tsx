import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  GalleryHorizontalEnd,
  Lock,
  Loader2,
  MessageSquare,
  Phone,
  Trash2,
  User,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/sanitize'
import { useAppStore } from '@/stores/appStore'
import { toast } from 'sonner'

const REMINDER_THRESHOLD_OPTIONS = [250, 500, 1000, 2000] as const
const REMINDER_TIME_OPTIONS = [
  { label: 'Morning (07:00)', value: '07:00' },
  { label: 'Afternoon (12:00)', value: '12:00' },
  { label: 'Evening (18:00)', value: '18:00' },
] as const

type ReminderThreshold = (typeof REMINDER_THRESHOLD_OPTIONS)[number]
type ReminderTime = (typeof REMINDER_TIME_OPTIONS)[number]['value']

export function Settings() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const setDisplayName = useAppStore((s) => s.setDisplayName)
  const clearAll = useAppStore((s) => s.clearAll)

  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [editingProfile, setEditingProfile] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [reminderThreshold, setReminderThreshold] = useState<ReminderThreshold>(500)
  const [reminderTime, setReminderTime] = useState<ReminderTime>('07:00')

  const displayName: string =
    user?.user_metadata?.full_name ?? user?.email ?? 'Unknown user'
  const email = user?.email ?? ''
  const showInstallPrompt =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    setDisplayNameInput(displayName)
  }, [displayName])

  useEffect(() => {
    const storedThreshold = Number(localStorage.getItem('mc_reminder_km_threshold'))
    if (REMINDER_THRESHOLD_OPTIONS.includes(storedThreshold as ReminderThreshold)) {
      setReminderThreshold(storedThreshold as ReminderThreshold)
    }

    const storedTime = localStorage.getItem('mc_reminder_time')
    if (REMINDER_TIME_OPTIONS.some((option) => option.value === storedTime)) {
      setReminderTime(storedTime as ReminderTime)
    }
  }, [])

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      clearAll()
      setLogoutConfirmOpen(false)
      navigate('/auth', { replace: true })
    } catch {
      toast.error("We couldn't log you out right now. Please check your connection.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const sanitizedName = sanitizeText(displayNameInput)

    if (!sanitizedName) {
      toast.error('Please enter a valid display name.')
      return
    }

    setDisplayName(sanitizedName)
    setDisplayNameInput(sanitizedName)
    setEditingProfile(false)
    toast.success('Display name updated for this session.')
  }

  function handleReminderThresholdChange(value: ReminderThreshold) {
    setReminderThreshold(value)
    localStorage.setItem('mc_reminder_km_threshold', String(value))
    toast.success('Reminder distance updated.')
  }

  function handleReminderTimeChange(value: ReminderTime) {
    setReminderTime(value)
    localStorage.setItem('mc_reminder_time', value)
    toast.success('Reminder time preference updated.')
  }

  return (
    <div className="bg-mz-gray-100 pb-8 animate-enter-up" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <PageHeader title="Settings" backTo="/" />

      {/* ── Profile card ── */}
      <div className="mb-6 overflow-hidden rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mz-red-light text-[15px] font-semibold text-mz-red"
            aria-hidden="true"
          >
            {initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-mz-black">{displayName}</p>
            <p className="truncate text-[11px] text-mz-gray-500">{email}</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-[12px] font-medium text-mz-red"
            onClick={() => setEditingProfile((current) => !current)}
          >
            Edit →
          </button>
        </div>

        {editingProfile ? (
          <form className="mt-4 border-t border-[#F0ECEC] pt-4" onSubmit={handleProfileSubmit}>
            <div className="space-y-4 pb-28">
              <div className="space-y-3 rounded-[20px] border border-mz-red-light bg-mz-red-pale p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-mz-gray-500">
                    <span>Profile setup</span>
                    <span>33% complete</span>
                  </div>
                  <div className="overflow-hidden rounded-full bg-white/90">
                    <div className="h-2 rounded-full bg-mz-red" style={{ width: '33%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-[28px] font-light italic leading-[1.05] text-mz-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Let&apos;s get to know you!
                  </p>
                  <p className="mt-2 text-[13px] text-mz-gray-600">
                    Start with the name you want to see across MazdaCare. We&apos;ll use it in your garage and reminders.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-black/6 bg-white p-4 shadow-sm">
                <label htmlFor="displayName" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">
                  What should we call you?
                </label>
                <div className="rounded-xl border border-mz-gray-300 bg-mz-gray-100 p-4 transition focus-within:border-mz-red focus-within:bg-white focus-within:ring-2 focus-within:ring-mz-red/10">
                  <input
                    id="displayName"
                    type="text"
                    value={displayNameInput}
                    onChange={(event) => setDisplayNameInput(event.target.value)}
                    className="h-auto w-full border-0 bg-transparent p-0 text-[16px] text-mz-black outline-none placeholder:text-mz-gray-500 focus:ring-0"
                    placeholder="Type the name you'd like on your profile"
                    maxLength={500}
                  />
                </div>
                <p className="mt-2 text-[12px] text-mz-gray-500">
                  This helps keep your service history and garage cards feeling personal.
                </p>
              </div>

              <button
                type="button"
                className="text-[13px] font-medium text-mz-gray-600 underline-offset-2 hover:underline"
                onClick={() => { setDisplayNameInput(displayName); setEditingProfile(false) }}
              >
                Not now
              </button>
            </div>

            <div className="sticky bottom-0 -mx-4 border-t border-black/5 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur">
              <button type="submit" className="w-full rounded-2xl bg-mz-red px-4 py-4 text-[14px] font-semibold text-white shadow-button transition hover:bg-mz-red-mid">
                Next: Add My Mazda
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* ── Group 1: Account ── */}
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-mz-gray-500">Account</p>
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Personal Details */}
        <button
          type="button"
          className="flex h-12 w-full items-center gap-3 border-b border-[#F0ECEC] px-4 text-left"
          onClick={() => setEditingProfile(true)}
        >
          <User className="h-[18px] w-[18px] shrink-0 text-mz-red" />
          <span className="flex-1 text-[15px] text-gray-800">Personal Details</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
        {/* Password & Security */}
        <button
          type="button"
          className="flex h-12 w-full items-center gap-3 px-4 text-left"
          onClick={() => toast.info('Password changes are managed via your email provider.')}
        >
          <Lock className="h-[18px] w-[18px] shrink-0 text-mz-red" />
          <span className="flex-1 text-[15px] text-gray-800">Password &amp; Security</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </div>

      {/* ── Group 2: Preferences ── */}
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-mz-gray-500">Preferences</p>
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Push Notifications */}
        <div className="flex h-12 w-full items-center gap-3 border-b border-[#F0ECEC] px-4">
          <Bell className="h-[18px] w-[18px] shrink-0 text-mz-red" />
          <span className="flex-1 text-[15px] text-gray-800">Push Notifications</span>
          <button
            type="button"
            role="switch"
            aria-checked={notifEnabled}
            aria-label="Toggle push notifications"
            onClick={handleToggleNotifications}
            className="relative ml-2 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
            style={{ background: notifEnabled ? '#A31526' : '#C4BABB' }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: notifEnabled ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>
        {/* Garage Display */}
        <button
          type="button"
          className="flex h-12 w-full items-center gap-3 px-4 text-left"
          onClick={() => toast.info('Garage display options coming soon.')}
        >
          <GalleryHorizontalEnd className="h-[18px] w-[18px] shrink-0 text-mz-red" />
          <span className="flex-1 text-[15px] text-gray-800">Garage Display</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-mz-red">Service reminders</h3>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Remind me</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {REMINDER_THRESHOLD_OPTIONS.map((option) => {
              const active = reminderThreshold === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleReminderThresholdChange(option)}
                  className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                    active
                      ? 'border-mz-red bg-mz-red-light text-mz-red'
                      : 'border-transparent bg-mz-gray-100 text-mz-gray-700'
                  }`}
                >
                  {option.toLocaleString()} km
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Reminder time</p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {REMINDER_TIME_OPTIONS.map((option) => {
              const active = reminderTime === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleReminderTimeChange(option.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-[12px] font-semibold transition ${
                    active
                      ? 'border-mz-red bg-mz-red-light text-mz-red'
                      : 'border-transparent bg-mz-gray-100 text-mz-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-mz-gray-500">
            Reminder times are approximate and depend on your time zone.
          </p>
        </div>
      </div>

      {/* ── Group 3: Support ── */}
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-mz-gray-500">Support</p>
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Contact Dealership */}
        <button
          type="button"
          className="flex h-12 w-full items-center gap-3 border-b border-[#F0ECEC] px-4 text-left"
          onClick={() => toast.info('Dealer contact details coming soon.')}
        >
          <Phone className="h-[18px] w-[18px] shrink-0 text-mz-red" />
          <span className="flex-1 text-[15px] text-gray-800">Contact Dealership</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
        {/* App Feedback */}
        <button
          type="button"
          className="flex h-12 w-full items-center gap-3 px-4 text-left"
          onClick={() => toast.info('Feedback form coming soon.')}
        >
          <MessageSquare className="h-[18px] w-[18px] shrink-0 text-mz-red" />
          <span className="flex-1 text-[15px] text-gray-800">App Feedback</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </div>

      <div className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
        <button
          type="button"
          onClick={() => toast.info('To delete your account, please contact support.')}
          className="flex h-12 w-full items-center gap-3 px-4 text-left"
        >
          <Trash2 className="h-[18px] w-[18px] shrink-0 text-mz-red/70" />
          <span className="flex-1 text-[15px] text-mz-red/70">Delete Account</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setLogoutConfirmOpen(true)}
        className="mb-6 flex h-12 w-full items-center justify-center rounded-xl border-2 border-mz-red bg-transparent text-[15px] font-semibold text-mz-red"
      >
        Log Out
      </button>

      {showInstallPrompt ? (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white/80 px-4 py-3">
          <p className="text-[12px] text-gray-500">
            Install MazdaCare to your Home Screen for quicker access
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-mz-red px-3 py-1.5 text-[12px] font-semibold text-white"
            onClick={() => toast.info('Install prompt wiring is coming soon.')}
          >
            Install
          </button>
        </div>
      ) : null}

      <div className="mt-8 mb-4 text-center text-sm text-gray-400">
        <p>MazdaCare App v1.0.0</p>
        <a href="#" className="mt-1 inline-block text-[12px] text-gray-400 underline underline-offset-2">
          Privacy Policy &amp; Terms of Service
        </a>
      </div>

      {logoutConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2
              className="text-[30px] font-light italic leading-none text-mz-black"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Leaving so soon?
            </h2>
            <p className="mt-2 text-[14px] text-mz-gray-600">
              Are you sure you want to log out of MazdaCare?
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="h-12 w-full rounded-xl bg-mz-gray-300 text-[14px] font-semibold text-mz-black disabled:opacity-70"
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-mz-red text-[14px] font-semibold text-white disabled:opacity-80"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
