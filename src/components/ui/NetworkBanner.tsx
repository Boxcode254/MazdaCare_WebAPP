import { useEffect, useRef, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

interface NetworkBannerProps {
  className?: string
}

export function NetworkBanner({ className = '' }: NetworkBannerProps) {
  const { isOnline, wasOffline } = useNetworkStatus()
  const [showBackOnline, setShowBackOnline] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const hasShownRecoveryRef = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      setShowBackOnline(false)
      setIsClosing(false)
      hasShownRecoveryRef.current = false
      return
    }

    if (!wasOffline || hasShownRecoveryRef.current) {
      return
    }

    hasShownRecoveryRef.current = true
    setShowBackOnline(true)
    setIsClosing(false)

    const dismissTimer = window.setTimeout(() => {
      setIsClosing(true)
    }, 1800)

    const hideTimer = window.setTimeout(() => {
      setShowBackOnline(false)
      setIsClosing(false)
    }, 2000)

    return () => {
      window.clearTimeout(dismissTimer)
      window.clearTimeout(hideTimer)
    }
  }, [isOnline, wasOffline])

  if (isOnline && !showBackOnline) {
    return null
  }

  const recoveryState = isOnline && showBackOnline
  const bannerClassName = recoveryState
    ? isClosing
      ? 'network-banner-exit bg-[#2E7D4F]'
      : 'network-banner-enter bg-[#2E7D4F]'
    : 'network-banner-enter bg-mz-gray-700'

  return (
    <div className={`pointer-events-none ${className}`.trim()}>
      <div
        aria-live="polite"
        className={`flex h-9 items-center justify-center gap-2 px-3 text-white shadow-[0_6px_18px_rgba(17,16,16,0.14)] ${bannerClassName}`}
      >
        {recoveryState ? null : <WifiOff className="h-[14px] w-[14px] shrink-0 text-white" />}
        <span className="text-[12px] font-medium text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {recoveryState ? 'Back online' : "You're offline — some features unavailable"}
        </span>
      </div>
    </div>
  )
}