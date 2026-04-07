import { useEffect } from 'react'
import { toast } from 'sonner'
const WARNING_TOAST_ID = 'idle-session-warning'

export function useIdleTimer(onIdle: () => void, warningMs = 25 * 60 * 1000, idleMs = 30 * 60 * 1000) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (!isStandalone) {
      return
    }

    let warnTimer: ReturnType<typeof setTimeout>
    let idleTimer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(warnTimer)
      clearTimeout(idleTimer)
      toast.dismiss(WARNING_TOAST_ID)

      warnTimer = setTimeout(() => {
        toast('Session expiring soon', {
          id: WARNING_TOAST_ID,
          description: 'Tap to stay signed in',
          action: { label: 'Stay signed in', onClick: reset },
          duration: 5 * 60 * 1000,
        })
      }, warningMs)

      idleTimer = setTimeout(() => {
        toast.dismiss(WARNING_TOAST_ID)
        onIdle()
      }, idleMs)
    }

    const events: Array<keyof WindowEventMap> = ['touchstart', 'click', 'keydown', 'scroll']
    events.forEach((eventName) => window.addEventListener(eventName, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(warnTimer)
      clearTimeout(idleTimer)
      toast.dismiss(WARNING_TOAST_ID)
      events.forEach((eventName) => window.removeEventListener(eventName, reset))
    }
  }, [idleMs, onIdle, warningMs])
}