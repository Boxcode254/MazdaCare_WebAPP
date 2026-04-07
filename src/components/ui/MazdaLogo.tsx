import type { CSSProperties } from 'react'
import emblemRed from '@/assets/logos/mazdacare-emblem-red.png'
import logoRed from '@/assets/logos/mazdacare-logo-red.png'
import wordmarkRed from '@/assets/logos/mazdacare-wordmark-red.png'

type Variant = 'icon' | 'wordmark' | 'full'
type Theme = 'dark' | 'light' | 'red'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface MazdaLogoProps {
  variant?: Variant
  theme?: Theme
  size?: Size
  className?: string
}

const SIZE_MAP: Record<Size, { iconHeight: number; wordmarkHeight: number; fullHeight: number }> = {
  xs: { iconHeight: 18, wordmarkHeight: 14, fullHeight: 30 },
  sm: { iconHeight: 24, wordmarkHeight: 18, fullHeight: 38 },
  md: { iconHeight: 34, wordmarkHeight: 24, fullHeight: 50 },
  lg: { iconHeight: 44, wordmarkHeight: 30, fullHeight: 62 },
  xl: { iconHeight: 56, wordmarkHeight: 38, fullHeight: 76 },
}

function getImageStyle(theme: Theme): CSSProperties {
  if (theme === 'red') {
    return {
      filter: 'brightness(0) invert(1)',
    }
  }

  if (theme === 'dark') {
    return {
      filter: 'drop-shadow(0 1px 2px rgba(17,16,16,0.18))',
    }
  }

  return {}
}

export default function MazdaLogo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  className,
}: MazdaLogoProps) {
  const { iconHeight, wordmarkHeight, fullHeight } = SIZE_MAP[size]
  const imageStyle = getImageStyle(theme)

  if (variant === 'icon') {
    return (
      <img
        src={emblemRed}
        alt="MazdaCare logo"
        className={className}
        style={{ height: `${iconHeight}px`, width: 'auto', ...imageStyle }}
      />
    )
  }

  if (variant === 'wordmark') {
    return (
      <img
        src={wordmarkRed}
        alt="MazdaCare"
        className={className}
        style={{ height: `${wordmarkHeight}px`, width: 'auto', ...imageStyle }}
      />
    )
  }

  return (
    <img
      src={logoRed}
      alt="MazdaCare"
      className={className}
      style={{ height: `${fullHeight}px`, width: 'auto', ...imageStyle }}
    />
  )
}
