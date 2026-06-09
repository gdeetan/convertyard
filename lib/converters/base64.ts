// lib/converters/base64.ts
import type { ToolOptions } from '@/lib/types'
import type { TextConvertResult } from '@/lib/types-text'

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromUrlSafe(b64: string): string {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return s
}

function encodeText(input: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)
  return urlSafe ? toUrlSafe(b64) : b64
}

function decodeText(input: string, urlSafe: boolean): string {
  const normalized = urlSafe ? fromUrlSafe(input.trim()) : input.trim()
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export function looksLikeBase64(input: string): boolean {
  const trimmed = input.trim()
  if (trimmed.length < 4) return false
  return /^[A-Za-z0-9+/\-_]+=*$/.test(trimmed) && trimmed.length % 4 === 0
}

export function convertBase64(input: string, opts: ToolOptions): TextConvertResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { output: '', outputMime: 'text/plain', outputFilename: 'output.txt', errorMessage: 'Input is empty' }
  }

  const mode = (opts.mode as string) ?? 'encode'
  const urlSafe = (opts.urlSafe as boolean) ?? false

  if (mode === 'encode') {
    return {
      output: encodeText(trimmed, urlSafe),
      outputMime: 'text/plain',
      outputFilename: 'encoded.txt',
    }
  }

  try {
    return {
      output: decodeText(trimmed, urlSafe),
      outputMime: 'text/plain',
      outputFilename: 'decoded.txt',
    }
  } catch {
    return {
      output: '',
      outputMime: 'text/plain',
      outputFilename: 'decoded.txt',
      errorMessage: 'Invalid base64 input. Check for non-base64 characters or incorrect padding.',
    }
  }
}

export async function fileToBase64Text(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}
