// lib/seo/og-image.tsx
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

interface OgImageTemplateProps {
  title: string
  subtitle?: string
}

export function makeOgResponse(props: OgImageTemplateProps) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: '#0f172a',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: '#3b82f6',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
            }}
          />
          <span style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 700 }}>
            ConvertYard
          </span>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              color: '#f1f5f9',
              fontSize: props.title.length > 40 ? '52px' : '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            {props.title}
          </div>
          {props.subtitle && (
            <div style={{ color: '#94a3b8', fontSize: '28px' }}>
              {props.subtitle}
            </div>
          )}
        </div>

        {/* Tagline footer */}
        <div style={{ color: '#475569', fontSize: '22px' }}>
          Local-first conversion, built for batches · convertyard.com
        </div>
      </div>
    ),
    OG_SIZE
  )
}
