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
        background:
          'radial-gradient(circle at top, rgba(194, 38, 61, 0.28), transparent 30%), linear-gradient(180deg, #171213 0%, #120d0f 100%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <MazdaLogo variant="full" theme="dark" size="xl" />
        <div className="h-[3px] w-[132px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#991728,#E46B80)]"
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
