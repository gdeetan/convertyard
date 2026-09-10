export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS 13+ reports as Mac; check touch points too
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1)
}

// Detect iOS WKWebView hosted inside a third-party app (Google, Facebook,
// Instagram, TikTok, LINE, etc.). These hosts ignore the HTML5 `download`
// attribute and silently drop programmatic blob-URL downloads.
export function isIosInAppBrowser(): boolean {
  if (!isIos()) return false
  const ua = navigator.userAgent
  // Real iOS Safari contains "Safari/" AND "Version/" but no third-party host token.
  const inAppTokens = [
    'GSA/', // Google app
    'FBAN/', 'FBAV/', 'FB_IAB', // Facebook / Messenger
    'Instagram',
    'Line/',
    'TikTok', 'musical_ly',
    'Twitter', 'TwitterAndroid',
    'LinkedInApp',
    'Snapchat',
    'Pinterest',
  ]
  return inAppTokens.some((t) => ua.includes(t))
}
