type Variant = 'icon' | 'wordmark' | 'full'
type Theme = 'dark' | 'light' | 'red'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface MazdaLogoProps {
  variant?: Variant
  theme?: Theme
  size?: Size
  className?: string
}

const SIZE_MAP: Record<Size, { iconHeight: number; fontSize: number }> = {
  xs: { iconHeight: 20, fontSize: 12 },
  sm: { iconHeight: 28, fontSize: 17 },
  md: { iconHeight: 40, fontSize: 24 },
  lg: { iconHeight: 52, fontSize: 31 },
  xl: { iconHeight: 72, fontSize: 43 },
}

function getColors(theme: Theme) {
  return {
    primary: theme === 'red' ? '#FFFFFF' : '#9B1B30',
    text: theme === 'light' ? '#111010' : '#FFFFFF',
    knockout: theme === 'dark' ? '#111010' : theme === 'red' ? '#9B1B30' : '#FDFBFB',
  }
}

function WingIcon({ iconHeight, theme }: { iconHeight: number; theme: Theme }) {
  const colors = getColors(theme)

  return (
    <svg
      width={iconHeight}
      height={iconHeight}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M26 6C26 6 19 13 19 26C19 39 26 46 26 46C26 46 33 39 33 26C33 13 26 6 26 6Z" fill={colors.primary} />
      <path d="M26 6C26 6 8 11 3 22C-2 33 5 43 12 46C12 46 20 38 21 26C22 15 26 6 26 6Z" fill={colors.primary} opacity="0.7" />
      <path d="M26 6C26 6 44 11 49 22C54 33 47 43 40 46C40 46 32 38 31 26C30 15 26 6 26 6Z" fill={colors.primary} opacity="0.7" />
      <circle cx="26" cy="26" r="5" fill={colors.primary} />
      <circle cx="26" cy="26" r="2.5" fill={colors.knockout} />
    </svg>
  )
}

function WordmarkText({ fontSize, theme }: { fontSize: number; theme: Theme }) {
  const colors = getColors(theme)
  const careFontSize = fontSize * 0.38

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: `${fontSize}px`,
          color: colors.text,
          lineHeight: 1,
        }}
      >
        Mazda
      </span>
      <span
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 500,
          fontSize: `${careFontSize}px`,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: colors.text,
          opacity: 0.55,
          lineHeight: 1,
          marginTop: `${Math.max(2, fontSize * 0.06)}px`,
        }}
      >
        CARE
      </span>
    </div>
  )
}

export default function MazdaLogo({ variant = 'full', theme = 'dark', size = 'md', className }: MazdaLogoProps) {
  const { iconHeight, fontSize } = SIZE_MAP[size]
  const gap = iconHeight * 0.25

  if (variant === 'icon') {
    return (
      <div className={className} style={{ display: 'inline-flex' }}>
        <WingIcon iconHeight={iconHeight} theme={theme} />
      </div>
    )
  }

  if (variant === 'wordmark') {
    return (
      <div className={className} style={{ display: 'inline-flex' }}>
        <WordmarkText fontSize={fontSize} theme={theme} />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${gap}px`,
      }}
    >
      <WingIcon iconHeight={iconHeight} theme={theme} />
      <WordmarkText fontSize={fontSize} theme={theme} />
    </div>
  )
}
