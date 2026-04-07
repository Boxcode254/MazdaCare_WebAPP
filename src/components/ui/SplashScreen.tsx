import { useEffect, useState } from 'react'
import MazdaLogo from '@/components/ui/MazdaLogo'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeStartTimer = window.setTimeout(() => {
      setFading(true)
    }, 800)

    const completeTimer = window.setTimeout(() => {
      onComplete()
    }, 1100)

    return () => {
      window.clearTimeout(fadeStartTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#111010',
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <MazdaLogo variant="full" theme="dark" size="xl" />
        <div className="h-[2px] w-[120px] overflow-hidden rounded-[1px] bg-white/10">
          <div
            className="h-full rounded-[1px] bg-[#9B1B30]"
            style={{
              animation: 'mc-splash-progress 600ms ease-out forwards',
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes mc-splash-progress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}