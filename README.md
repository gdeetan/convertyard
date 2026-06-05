# ConvertYard

Local-first batch file conversion, entirely in your browser.

## Development

```bash
npm install
npm run dev
```

## Analytics Setup

Three analytics systems are used. Two require no configuration:

**Cloudflare Web Analytics** — active automatically when the domain is proxied through Cloudflare. No environment variable or script tag needed.

**Google Search Console** — verified via Cloudflare DNS TXT record. No environment variable or meta tag needed.

**Google Analytics 4** — requires a measurement ID:

1. Go to [analytics.google.com](https://analytics.google.com) → Admin → Data Streams → your web stream
2. Copy the Measurement ID (format: `G-XXXXXXXXXX`)
3. For local development: copy `.env.local.example` to `.env.local` and fill in the ID
4. For production: add to Cloudflare Pages → Settings → Environment Variables → Production:
   - Variable name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: your `G-XXXXXXXXXX` ID

GA4 only loads after the user accepts the cookie consent banner. If the env variable is missing, the banner still appears but GA4 never loads (no errors).
