import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone) {
      setDismissed(true)
      return
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function onAppInstalled() {
      setDismissed(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDismissed(true)
    }

    setDeferredPrompt(null)
  }

  if (!deferredPrompt || dismissed) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl z-50">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/90">Install MazdaCare for faster access from your home screen.</p>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="shrink-0 rounded-xl bg-[#A31526] px-4 py-2 text-sm font-semibold text-white"
        >
          Install
        </button>
      </div>
    </div>
  )
}