export type Aspect = '16:9' | '9:16' | '1:1' | '4:5'
export type Resolution = '720p' | '1080p'

const TABLE: Record<string, Record<string, { w: number; h: number }>> = {
  '16:9': { '720p': { w: 1280, h: 720  }, '1080p': { w: 1920, h: 1080 } },
  '9:16': { '720p': { w: 720,  h: 1280 }, '1080p': { w: 1080, h: 1920 } },
  '1:1':  { '720p': { w: 720,  h: 720  }, '1080p': { w: 1080, h: 1080 } },
  '4:5':  { '720p': { w: 864,  h: 1080 }, '1080p': { w: 1296, h: 1620 } },
}

export function resolveDimensions(aspect: string, resolution: string): { w: number; h: number } {
  return TABLE[aspect]?.[resolution] ?? TABLE['16:9']['720p']
}
