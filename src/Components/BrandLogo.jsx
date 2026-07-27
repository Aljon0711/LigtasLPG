/**
 * LigtasLPG brand mark — wifi structure in brand red with white inner strokes.
 */
export default function BrandLogo({
  size = 24,
  className = '',
  title = 'LigtasLPG',
  onDark = false,
}) {
  const px = typeof size === 'number' ? `${size}px` : size
  const outer = onDark ? '#FFFFFF' : '#AF101A'
  const inner = onDark ? '#AF101A' : '#FFFFFF'

  return (
    <svg
      className={className}
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Outer arc — body + white stripe inside */}
      <path
        d="M7.5 19.5C14.4 12.4 33.6 12.4 40.5 19.5"
        stroke={outer}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M7.5 19.5C14.4 12.4 33.6 12.4 40.5 19.5"
        stroke={inner}
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      {/* Middle arc */}
      <path
        d="M13.5 25.2C18.4 20.4 29.6 20.4 34.5 25.2"
        stroke={outer}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 25.2C18.4 20.4 29.6 20.4 34.5 25.2"
        stroke={inner}
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      {/* Inner arc */}
      <path
        d="M19.2 30.6C22 28 26 28 28.8 30.6"
        stroke={outer}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M19.2 30.6C22 28 26 28 28.8 30.6"
        stroke={inner}
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      {/* Base dot — red with white center */}
      <circle cx="24" cy="36.4" r="3.8" fill={outer} />
      <circle cx="24" cy="36.4" r="1.6" fill={inner} />
    </svg>
  )
}
