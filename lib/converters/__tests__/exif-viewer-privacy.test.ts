import { describe, it, expect } from 'vitest'
import { auditPrivacy } from '../exif-viewer-privacy'

describe('auditPrivacy', () => {
  it('flags GPS coordinates as high severity', () => {
    const flags = auditPrivacy({
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
    })
    expect(flags).toContainEqual(expect.objectContaining({ severity: 'high', fixGroup: 'gps' }))
  })

  it('flags a personal name in Artist as high severity', () => {
    const flags = auditPrivacy({ Artist: 'Jane Smith' })
    expect(flags).toContainEqual(expect.objectContaining({ severity: 'high', fixGroup: 'personal', tag: 'Artist' }))
  })

  it('does NOT flag an obviously non-personal Artist value', () => {
    const flags = auditPrivacy({ Artist: '' })
    expect(flags.find(f => f.tag === 'Artist')).toBeUndefined()
  })

  it('flags SerialNumber as high severity', () => {
    const flags = auditPrivacy({ SerialNumber: '1234567890' })
    expect(flags).toContainEqual(expect.objectContaining({ severity: 'high', fixGroup: 'device' }))
  })

  it('flags absolute file path in XMP as high severity', () => {
    const flags = auditPrivacy({ 'xmp:RawFileName': 'file:///Users/jane/Photos/IMG_0001.HEIC' })
    expect(flags).toContainEqual(expect.objectContaining({ severity: 'high', fixGroup: 'path' }))
    const flags2 = auditPrivacy({ 'xmp:RawFileName': 'C:\\Users\\Jane\\photo.jpg' })
    expect(flags2).toContainEqual(expect.objectContaining({ severity: 'high', fixGroup: 'path' }))
  })

  it('flags Software + HostComputer as medium (device fingerprinting)', () => {
    const flags = auditPrivacy({ Software: 'iOS 17.5.1', HostComputer: 'iPhone 15 Pro' })
    expect(flags).toContainEqual(expect.objectContaining({ severity: 'medium', fixGroup: 'device' }))
  })

  it('emits no flags for empty metadata', () => {
    expect(auditPrivacy({})).toEqual([])
  })
})
