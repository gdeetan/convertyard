import { describe, it, expect } from 'vitest'
import { fileMatchesAccept } from '../drop-files'

const VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-ms-wmv',
  'video/mp2t',
]
const VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv', '.ts']

function fakeFile(name: string, type: string): File {
  return new File(['x'], name, { type })
}

describe('fileMatchesAccept', () => {
  it('accepts a file by MIME type', () => {
    expect(fileMatchesAccept(fakeFile('clip.mp4', 'video/mp4'), VIDEO_MIMES, VIDEO_EXTS)).toBe(true)
  })

  it('accepts a folder-dropped file with an empty MIME type if the extension matches', () => {
    expect(fileMatchesAccept(fakeFile('lecture-01.mp4', ''), VIDEO_MIMES, VIDEO_EXTS)).toBe(true)
    expect(fileMatchesAccept(fakeFile('clip.MOV', ''), VIDEO_MIMES, VIDEO_EXTS)).toBe(true)
  })

  it('rejects a file with neither a matching MIME type nor extension', () => {
    expect(fileMatchesAccept(fakeFile('notes.pdf', 'application/pdf'), VIDEO_MIMES, VIDEO_EXTS)).toBe(false)
    expect(fileMatchesAccept(fakeFile('.DS_Store', ''), VIDEO_MIMES, VIDEO_EXTS)).toBe(false)
  })

  it('accepts everything when accepts is empty or includes */*', () => {
    expect(fileMatchesAccept(fakeFile('a.bin', ''), [], ['.bin'])).toBe(true)
    expect(fileMatchesAccept(fakeFile('a.bin', ''), ['*/*'], ['.bin'])).toBe(true)
  })
})
