export type UpscaleScale = '2x' | '3x' | '4x' | '8x'
export type PhotoMode = 'photo' | 'photo-compressed'
export type ImageMode = 'auto' | 'photo' | 'photo-compressed' | 'graphic' | 'illustration'
export type DetectedMode = 'photo' | 'photo-compressed' | 'graphic'
export type ResolvedMode = 'photo' | 'photo-compressed' | 'graphic' | 'illustration'
export type OnnxDevice = 'webgpu' | 'wasm' | 'cpu'
export type ChainKind = 'swin2sr' | 'realesrgan'

export const SWIN2SR_CLASSICAL_X2 = 'Xenova/swin2SR-classical-sr-x2-64'
export const SWIN2SR_COMPRESSED_X2 = 'Xenova/swin2SR-compressed-sr-x2-48'
export const SWIN2SR_REALWORLD_X4 = 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr'
export const REALESRGAN_X4 = 'realesr-general-x4v3'
export const REALESRGAN_ANIME_X4 = 'realesr-animevideov3'
export const REALESRGAN_ANIME_STILL_X4 = 'realesrgan-x4plus-anime-6b'
export const YUNET_FACE_ID = 'yunet-face'
export const GFPGAN_FACE_ID = 'gfpgan-v1.4'

export const REALESRGAN_LOCAL_URL = '/models/realesr-general-x4v3.onnx'
export const REALESRGAN_HF_URL =
  'https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx'
export const REALESRGAN_ANIME_LOCAL_URL = '/models/realesr-animevideov3.onnx'
export const REALESRGAN_ANIME_HF_URL =
  'https://huggingface.co/tidus2102/Real-ESRGAN/resolve/main/RealESR-AnimeVideo-v3_x4.onnx'
export const REALESRGAN_ANIME_STILL_LOCAL_URL = '/models/realesrgan-x4plus-anime-6b.onnx'
export const REALESRGAN_ANIME_STILL_HF_URL =
  'https://huggingface.co/deepghs/imgutils-models/resolve/main/real_esrgan/RealESRGAN_x4plus_anime_6B.onnx'
export const YUNET_LOCAL_URL = '/models/face-detection-yunet.onnx'
export const YUNET_REMOTE_URL =
  'https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx'
export const GFPGAN_LOCAL_URL = '/models/gfpgan-v1.4.onnx'
export const GFPGAN_REMOTE_URL =
  'https://huggingface.co/facefusion/models-3.0.0/resolve/main/gfpgan_1.4.onnx'

export const REALESRGAN_SOURCES: Record<string, { local: string; remote: string; fail: string }> = {
  [REALESRGAN_X4]: {
    local: REALESRGAN_LOCAL_URL,
    remote: REALESRGAN_HF_URL,
    fail: 'Failed to download Real-ESRGAN v3 model',
  },
  [REALESRGAN_ANIME_X4]: {
    local: REALESRGAN_ANIME_LOCAL_URL,
    remote: REALESRGAN_ANIME_HF_URL,
    fail: 'Failed to download illustration upscaler model',
  },
  [REALESRGAN_ANIME_STILL_X4]: {
    local: REALESRGAN_ANIME_STILL_LOCAL_URL,
    remote: REALESRGAN_ANIME_STILL_HF_URL,
    fail: 'Failed to download illustration upscaler model',
  },
  [YUNET_FACE_ID]: {
    local: YUNET_LOCAL_URL,
    remote: YUNET_REMOTE_URL,
    fail: 'Failed to download face detector',
  },
  [GFPGAN_FACE_ID]: {
    local: GFPGAN_LOCAL_URL,
    remote: GFPGAN_REMOTE_URL,
    fail: 'Failed to download face restore model',
  },
}

export interface ModelChain {
  modelId: string
  scale: number
  kind: ChainKind
}

export interface ModelRouting {
  chains: ModelChain[]
  actualScale: number
}

export interface TileSettings {
  tilePx: number
  overlap: number
  dtype: 'fp16' | 'q8'
}

export function blobEncodeOptions(mime: string): { type: string; quality?: number } {
  if (mime === 'image/png') return { type: mime }
  if (mime === 'image/jpeg' || mime === 'image/webp') return { type: mime, quality: 0.97 }
  return { type: mime }
}

export type UpscalerClientProfile = 'desktop' | 'android' | 'ios'

export function detectUpscalerClientProfile(
  ua: string,
  maxTouchPoints = 0,
  platform = ''
): UpscalerClientProfile {
  if (/iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

export function tileSettings(
  device: OnnxDevice,
  profile: UpscalerClientProfile = 'desktop'
): TileSettings {
  if (profile !== 'desktop') return { tilePx: 64, overlap: 8, dtype: 'fp16' }
  if (device === 'webgpu') return { tilePx: 256, overlap: 16, dtype: 'fp16' }
  return { tilePx: 128, overlap: 8, dtype: 'q8' }
}

export function maxOutputDim(
  profile: UpscalerClientProfile,
  kind: 'onnx' | 'graphic' = 'onnx'
): number {
  if (profile === 'desktop') return kind === 'graphic' ? 16384 : 8192
  return 2048
}

export function shouldUseOnnxOnClient(profile: UpscalerClientProfile): boolean {
  return profile !== 'ios'
}

export function padToMultiple(n: number, multiple = 8): number {
  return Math.ceil(n / multiple) * multiple
}

/** WebGPU ORT aliases input/output when ONNX spatial dim names match. */
export function isOnnxRunError(message: string): boolean {
  return /failed to call OrtRun/i.test(message) || /shape mismatch attempting to re-use buffer/i.test(message)
}

function x2Model(mode: PhotoMode): string {
  return mode === 'photo-compressed' ? SWIN2SR_COMPRESSED_X2 : SWIN2SR_CLASSICAL_X2
}

export function modelRouting(scale: UpscaleScale, mode: PhotoMode): ModelRouting {
  switch (scale) {
    case '2x':
      return { chains: [{ modelId: x2Model(mode), scale: 2, kind: 'swin2sr' }], actualScale: 2 }
    case '3x':
      return { chains: [{ modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' }], actualScale: 4 }
    case '4x':
      return { chains: [{ modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' }], actualScale: 4 }
    case '8x':
      // Swin2SR x2 on WebGPU tries to reuse the input buffer for a 2× output
      // ({1,3,H,W} != {1,3,2H,2W}). Same 4× model as illustration 8×, then Lanczos.
      return { chains: [{ modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' }], actualScale: 8 }
  }
}

export function resolveImageMode(imageMode: ImageMode, detected?: DetectedMode): ResolvedMode {
  switch (imageMode) {
    case 'auto':
      if (!detected) throw new Error('auto-detect requires a detected mode')
      return detected === 'graphic' ? 'illustration' : detected
    case 'illustration':
      return 'illustration'
    case 'graphic':
      return 'graphic'
    case 'photo-compressed':
      return 'photo-compressed'
    default:
      return 'photo'
  }
}

export function illustrationRouting(scale: UpscaleScale): ModelRouting {
  const actualScale = { '2x': 2, '3x': 3, '4x': 4, '8x': 8 }[scale]
  return {
    chains: [{ modelId: REALESRGAN_ANIME_STILL_X4, scale: 4, kind: 'realesrgan' }],
    actualScale,
  }
}

/** Real-ESRGAN ONNX sessions: WebGPU when present, WASM otherwise. Never skip AI just because WebGPU is missing. */
export function realesrganDeviceOrder(webgpu: boolean): OnnxDevice[] {
  return webgpu ? ['webgpu', 'wasm'] : ['wasm']
}

export function swin2srFallbackRouting(scale: UpscaleScale, mode: PhotoMode): ModelRouting {
  switch (scale) {
    case '2x':
      return modelRouting(scale, mode)
    case '3x':
    case '4x':
      return { chains: [{ modelId: SWIN2SR_REALWORLD_X4, scale: 4, kind: 'swin2sr' }], actualScale: 4 }
    case '8x':
      return { chains: [{ modelId: SWIN2SR_REALWORLD_X4, scale: 4, kind: 'swin2sr' }], actualScale: 8 }
  }
}
