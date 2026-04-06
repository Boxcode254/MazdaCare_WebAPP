type Variant = 'icon' | 'wordmark' | 'full';
type Theme = 'light' | 'dark' | 'red';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface MazdaLogoProps {
  variant?: Variant;
  theme?: Theme;
  size?: Size;
  className?: string;
}

const SIZE_MAP: Record<Size, { iconHeight: number; fontSize: number }> = {
  sm: { iconHeight: 28, fontSize: 18 },
  md: { iconHeight: 40, fontSize: 24 },
  lg: { iconHeight: 52, fontSize: 32 },
  xl: { iconHeight: 72, fontSize: 44 },
};

function getColors(theme: Theme) {
  switch (theme) {
    case 'dark':
      return { icon: '#9B1B30', text: '#FFFFFF', ringInner: '#111010' };
    case 'red':
      return { icon: '#FFFFFF', text: '#FFFFFF', ringInner: '#9B1B30' };
    case 'light':
    default:
      return { icon: '#9B1B30', text: '#111010', ringInner: '#FDFBFB' };
  }
}

interface WingIconProps {
  iconHeight: number;
  colors: ReturnType<typeof getColors>;
}

function WingIcon({ iconHeight, colors }: WingIconProps) {
  const iconWidth = iconHeight; // viewBox is square 52×52
  return (
    <svg
      width={iconWidth}
      height={iconHeight}
      viewBox="0 0 52 52"
      fill={colors.icon}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left wing petal */}
      <path
        d="M26 6 C26 6, 8 11, 3 22 C-2 33, 5 43, 12 46 C12 46, 20 38, 21 26 C22 15, 26 6, 26 6 Z"
        opacity="0.7"
      />
      {/* Right wing petal */}
      <path
        d="M26 6 C26 6, 44 11, 49 22 C54 33, 47 43, 40 46 C40 46, 32 38, 31 26 C30 15, 26 6, 26 6 Z"
        opacity="0.7"
      />
      {/* Center vertical petal */}
      <path d="M26 6 C26 6, 19 13, 19 26 C19 39, 26 46, 26 46 C26 46, 33 39, 33 26 C33 13, 26 6, 26 6 Z" />
      {/* Center ring outer */}
      <circle cx="26" cy="26" r="5" />
      {/* Center ring inner knockout */}
      <circle cx="26" cy="26" r="2.5" fill={colors.ringInner} />
    </svg>
  );
}

interface WordmarkTextProps {
  fontSize: number;
  colors: ReturnType<typeof getColors>;
}

function WordmarkText({ fontSize, colors }: WordmarkTextProps) {
  const careFontSize = fontSize * 0.4;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
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
          letterSpacing: '3.5px',
          textTransform: 'uppercase',
          color: colors.text,
          opacity: 0.45,
          lineHeight: 1,
          marginTop: `${careFontSize * 0.3}px`,
        }}
      >
        Care
      </span>
    </div>
  );
}

export default function MazdaLogo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  className,
}: MazdaLogoProps) {
  const { iconHeight, fontSize } = SIZE_MAP[size];
  const colors = getColors(theme);
  const gap = Math.round(iconHeight * 0.3);

  if (variant === 'icon') {
    return (
      <div className={className} style={{ display: 'inline-flex' }}>
        <WingIcon iconHeight={iconHeight} colors={colors} />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={className} style={{ display: 'inline-flex' }}>
        <WordmarkText fontSize={fontSize} colors={colors} />
      </div>
    );
  }

  // 'full' — icon + wordmark side by side
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: `${gap}px`,
      }}
    >
      <WingIcon iconHeight={iconHeight} colors={colors} />
      <WordmarkText fontSize={fontSize} colors={colors} />
    </div>
  );
}
