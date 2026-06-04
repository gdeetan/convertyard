import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const alt = 'ConvertYard — Local-first conversion, built for batches'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FAFAF9',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Top: mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="44" height="40" viewBox="0 0 44 40">
            <rect x="0" y="27" width="34" height="7" rx="2" fill="#C2410C" opacity="0.45" />
            <rect x="5" y="17" width="34" height="7" rx="2" fill="#C2410C" opacity="0.72" />
            <rect x="10" y="7"  width="34" height="7" rx="2" fill="#C2410C" />
          </svg>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#1C1917', letterSpacing: '-0.5px' }}>
            ConvertYard
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 68, fontWeight: 700, color: '#1C1917', letterSpacing: '-2px', lineHeight: 1.1 }}>
              Local-first conversion,
            </span>
            <span style={{ fontSize: 68, fontWeight: 700, color: '#1C1917', letterSpacing: '-2px', lineHeight: 1.1 }}>
              built for batches.
            </span>
          </div>
          <span style={{ fontSize: 26, color: '#57534E', lineHeight: 1.5 }}>
            1,000+ files at once. Nothing uploads. Free forever.
          </span>
        </div>

        {/* Bottom: trust pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Files never leave your browser', '1,000+ files per batch', 'No account required'].map(
            (text) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  background: '#F5F5F4',
                  border: '1px solid #E7E5E4',
                  borderRadius: 9999,
                  padding: '10px 20px',
                  fontSize: 18,
                  color: '#57534E',
                }}
              >
                {text}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
