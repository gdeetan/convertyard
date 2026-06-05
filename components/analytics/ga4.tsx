'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const MID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

export function GA4() {
  const [load, setLoad] = useState(false)

  useEffect(() => {
    if (!MID) return

    if (getCookieValue('convertyard_consent') === 'accepted') {
      setLoad(true)
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ accepted: boolean }>).detail
      if (detail.accepted) setLoad(true)
    }

    window.addEventListener('consent-changed', handler)
    return () => window.removeEventListener('consent-changed', handler)
  }, [])

  if (!MID || !load) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MID}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  )
}
