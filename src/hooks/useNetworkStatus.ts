import { useEffect, useState } from 'react'

interface NetworkStatus {
  isOnline: boolean
  wasOffline: boolean
}

function readOnlineStatus() {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(readOnlineStatus)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    setIsOnline(readOnlineStatus())

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}