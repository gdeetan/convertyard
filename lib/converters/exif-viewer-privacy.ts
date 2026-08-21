import type { PrivacyFlag } from './exif-viewer.types'

const ABSOLUTE_PATH_RE = /^(file:\/\/|[a-zA-Z]:[\\/])/

/**
 * Runs the privacy-audit rules from spec §5. Input is the raw exifr output
 * merged across all segments (EXIF, XMP, IPTC).
 */
export function auditPrivacy(raw: Record<string, unknown>): PrivacyFlag[] {
  const out: PrivacyFlag[] = []
  const has = (k: string) => raw[k] !== undefined && raw[k] !== null && raw[k] !== ''

  if (has('GPSLatitude') && has('GPSLongitude')) {
    out.push({
      severity: 'high',
      tag: 'GPSLatitude',
      message: 'GPS coordinates reveal where this photo was taken.',
      fixGroup: 'gps',
    })
  }

  for (const tag of ['Artist', 'Copyright', 'By-line', 'Creator', 'dc:creator']) {
    const v = raw[tag]
    if (typeof v === 'string' && v.trim().length > 0) {
      out.push({
        severity: 'high',
        tag,
        message: 'Your name or attribution is embedded in the file.',
        fixGroup: 'personal',
      })
    }
  }

  for (const tag of ['SerialNumber', 'BodySerialNumber', 'LensSerialNumber', 'CameraSerialNumber']) {
    if (has(tag)) {
      out.push({
        severity: 'high',
        tag,
        message: 'Device serial number can identify your specific camera.',
        fixGroup: 'device',
      })
    }
  }

  for (const tag of ['xmp:RawFileName', 'RawFileName', 'OriginalRawFileName', 'DocumentAncestors']) {
    const v = raw[tag]
    if (typeof v === 'string' && ABSOLUTE_PATH_RE.test(v)) {
      out.push({
        severity: 'high',
        tag,
        message: 'The original file path on your computer is embedded.',
        fixGroup: 'path',
      })
    }
  }

  if (has('Software') && has('HostComputer')) {
    out.push({
      severity: 'medium',
      tag: 'Software',
      message: 'Device and software version together can fingerprint your setup.',
      fixGroup: 'device',
    })
  }

  return out
}
