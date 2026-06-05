'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { getCookieValue } from '@/lib/utils/cookies'

const MID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const CONSENT_COOKIE = 'convertyard_consent'
export const CONSENT_EVENT = 'consent-changed'

export function GA4() {
  const [load, setLoad] = useState(false)

  useEffect(() => {
    if (!MID) return

    if (getCookieValue(CONSENT_COOKIE) === 'accepted') {
      setLoad(true)
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ accepted: boolean }>).detail
      if (detail?.accepted) setLoad(true)
    }

    window.addEventListener(CONSENT_EVENT, handler)
    return () => window.removeEventListener(CONSENT_EVENT, handler)
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
            send_page_view: true
          });
        `}
      </Script>
    </>
  )
}
