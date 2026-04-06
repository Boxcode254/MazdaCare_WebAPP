import { useEffect, useState } from 'react'
import MazdaLogo from '@/components/ui/MazdaLogo'

const SESSION_KEY = 'splash_shown'

export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) !== 'true'
    } catch {
      return false
    }
  })
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!visible) return

    const showTimer = setTimeout(() => {
      setFading(true)
      try {
        sessionStorage.setItem(SESSION_KEY, 'true')
      } catch {
        // sessionStorage unavailable — ignore
      }
    }, 800)

    return () => clearTimeout(showTimer)
  }, [visible])

  useEffect(() => {
    if (!fading) return
    const fadeTimer = setTimeout(() => setVisible(false), 300)
    return () => clearTimeout(fadeTimer)
  }, [fading])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111010',
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <MazdaLogo variant="full" theme="dark" size="xl" />
    </div>
  )
}
