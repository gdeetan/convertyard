// JWT decode + verify — fully client-side via Web Crypto API

export interface JwtHeader {
  alg: string
  typ?: string
  [key: string]: unknown
}

export interface JwtPayload {
  exp?: number
  iat?: number
  nbf?: number
  [key: string]: unknown
}

export interface JwtParts {
  header: JwtHeader
  payload: JwtPayload
  signature: string
  raw: { header: string; payload: string; signature: string }
}

export interface JwtDecodeResult {
  parts?: JwtParts
  error?: string
}

export interface JwtVerifyResult {
  valid: boolean
  error?: string
}

function base64urlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4 !== 0) b64 += '='
  try {
    return atob(b64)
  } catch {
    throw new Error('Invalid base64url encoding')
  }
}

function base64urlToArrayBuffer(str: string): ArrayBuffer {
  const binary = base64urlDecode(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer as ArrayBuffer
}

export function decodeJwt(token: string): JwtDecodeResult {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return { error: `Expected 3 dot-separated parts, got ${parts.length}` }
  }
  const [rawHeader, rawPayload, rawSignature] = parts
  try {
    const header = JSON.parse(base64urlDecode(rawHeader)) as JwtHeader
    const payload = JSON.parse(base64urlDecode(rawPayload)) as JwtPayload
    return {
      parts: {
        header,
        payload,
        signature: rawSignature,
        raw: { header: rawHeader, payload: rawPayload, signature: rawSignature },
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to decode JWT' }
  }
}

export function formatRelativeTime(epochSeconds: number): { text: string; expired: boolean } {
  const now = Date.now() / 1000
  const diff = epochSeconds - now
  const abs = Math.abs(diff)
  const expired = diff < 0

  let text: string
  if (abs < 60) text = `${Math.round(abs)}s`
  else if (abs < 3600) text = `${Math.round(abs / 60)}m`
  else if (abs < 86400) text = `${Math.round(abs / 3600)}h`
  else text = `${Math.round(abs / 86400)}d`

  return { text: expired ? `${text} ago` : `in ${text}`, expired }
}

function pemToDer(pem: string): ArrayBuffer {
  const lines = pem.trim().split('\n').filter(l => !l.startsWith('-----'))
  const b64 = lines.join('')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function verifyJwt(
  token: string,
  keyMaterial: string,
  alg: string
): Promise<JwtVerifyResult> {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return { valid: false, error: 'Invalid token structure' }
  const [rawHeader, rawPayload, rawSignature] = parts
  const signingInput = new TextEncoder().encode(`${rawHeader}.${rawPayload}`)
  const sigBytes = base64urlToArrayBuffer(rawSignature)

  try {
    if (alg === 'HS256' || alg === 'HS384' || alg === 'HS512') {
      const hashName = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : 'SHA-512'
      const keyBytes = new TextEncoder().encode(keyMaterial)
      const key = await crypto.subtle.importKey(
        'raw', keyBytes, { name: 'HMAC', hash: hashName }, false, ['verify']
      )
      const valid = await crypto.subtle.verify('HMAC', key, sigBytes, signingInput)
      return { valid }
    }

    if (alg === 'RS256' || alg === 'RS384' || alg === 'RS512') {
      const hashName = alg === 'RS256' ? 'SHA-256' : alg === 'RS384' ? 'SHA-384' : 'SHA-512'
      const der = pemToDer(keyMaterial)
      const key = await crypto.subtle.importKey(
        'spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: hashName }, false, ['verify']
      )
      const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, signingInput)
      return { valid }
    }

    if (alg === 'ES256' || alg === 'ES384' || alg === 'ES512') {
      const namedCurve = alg === 'ES256' ? 'P-256' : alg === 'ES384' ? 'P-384' : 'P-521'
      const hashName = alg === 'ES256' ? 'SHA-256' : alg === 'ES384' ? 'SHA-384' : 'SHA-512'
      const der = pemToDer(keyMaterial)
      const key = await crypto.subtle.importKey(
        'spki', der, { name: 'ECDSA', namedCurve }, false, ['verify']
      )
      const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: hashName }, key, sigBytes, signingInput)
      return { valid }
    }

    return { valid: false, error: `Algorithm ${alg} is not supported for client-side verification` }
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Verification failed' }
  }
}
