import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone) {
      setInstalled(true)
      return
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function onAppInstalled() {
      setInstalled(true)
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
      setInstalled(true)
    }

    setDeferredPrompt(null)
  }

  if (installed || !deferredPrompt) return null

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Install App</p>
          <p className="text-sm text-red-800">Install MazdaCare on your phone for faster access.</p>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-[#C00000] text-white hover:bg-[#a00000]"
          onClick={() => void handleInstall()}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Install
        </Button>
      </div>
    </div>
  )
}
