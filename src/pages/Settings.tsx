import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { sanitizeText } from '@/lib/sanitize'
import { useAppStore } from '@/stores/appStore'
import { toast } from 'sonner'

export function Settings() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const user = useAppStore((s) => s.user)
  const setDisplayName = useAppStore((s) => s.setDisplayName)

  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [signingOut, setSigningOut] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')

  const displayName: string =
    user?.user_metadata?.full_name ?? user?.email ?? 'Unknown user'
  const email = user?.email ?? ''

  useEffect(() => {
    setDisplayNameInput(displayName)
  }, [displayName])

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

  return (
    <div className="bg-mz-gray-100 pb-8 animate-enter-up" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <PageHeader title="Settings" backTo="/" />

      {/* ── Profile card ── */}
      <div className="mb-[10px] overflow-hidden rounded-[16px] bg-white p-4">
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
          <form className="mt-4 space-y-3 border-t border-[#F0ECEC] pt-4" onSubmit={handleProfileSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="displayName"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayNameInput}
                onChange={(event) => setDisplayNameInput(event.target.value)}
                className="h-auto w-full rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black outline-none transition focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]"
                placeholder="Enter your name"
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-mz-red px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-mz-red-mid"
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-xl bg-mz-gray-100 px-4 py-2 text-[13px] font-medium text-mz-gray-700 transition hover:bg-[#E8E2E3]"
                onClick={() => {
                  setDisplayNameInput(displayName)
                  setEditingProfile(false)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* ── Preferences group ── */}
      <div className="mb-[10px] overflow-hidden rounded-[16px] bg-white">
        <p className="px-[14px] pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-mz-red">
          Preferences
        </p>

        {/* Service reminders toggle */}
        <div className="flex items-center justify-between border-b border-[#F0ECEC] px-[14px] py-3">
          <div>
            <p className="text-[13px] text-mz-black">Service reminders</p>
            <p className="mt-[1px] text-[11px] text-mz-gray-500">
              {notifEnabled ? 'Notifications enabled' : 'Notifications off'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifEnabled}
            aria-label="Toggle service reminders"
            onClick={handleToggleNotifications}
            className="relative ml-3 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
            style={{ background: notifEnabled ? '#9B1B30' : '#C4BABB' }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: notifEnabled ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>

        {/* Mileage unit — km fixed for Kenya */}
        <div className="flex items-center justify-between px-[14px] py-3">
          <div>
            <p className="text-[13px] text-mz-black">Mileage unit</p>
            <p className="mt-[1px] text-[11px] text-mz-gray-500">Fixed to km for Kenya</p>
          </div>
          <span className="rounded-full bg-mz-gray-100 px-3 py-1 text-[11px] font-medium text-mz-gray-700">
            km
          </span>
        </div>
      </div>

      {/* ── App group ── */}
      <div className="mb-[10px] overflow-hidden rounded-[16px] bg-white">
        <p className="px-[14px] pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-mz-red">
          App
        </p>
        <div className="flex items-center justify-between border-b border-[#F0ECEC] px-[14px] py-3">
          <p className="text-[13px] text-mz-black">Version</p>
          <span className="text-[12px] text-mz-gray-500">v1.2.0</span>
        </div>
        <div className="flex items-center justify-between px-[14px] py-3">
          <p className="text-[13px] text-mz-black">Region</p>
          <span className="text-[12px] text-mz-gray-500">Kenya (KES)</span>
        </div>
      </div>

      {/* ── Account / danger group ── */}
      <div className="mb-[10px] overflow-hidden rounded-[16px] bg-white">
        <p className="px-[14px] pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-mz-red">
          Account
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center border-b border-[#F0ECEC] px-[14px] py-3 text-left text-[13px] font-medium text-mz-red disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        <button
          type="button"
          onClick={() => toast.info('To delete your account, please contact support.')}
          className="flex w-full items-center px-[14px] py-3 text-left text-[13px] text-mz-red"
        >
          Delete account
        </button>
      </div>

      {/* App version footer */}
      <p className="py-5 text-center text-[11px] text-mz-gray-300">MazdaCare v1.2.0</p>
    </div>
  )
}
