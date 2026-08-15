export type UpscaleScale = '2x' | '3x' | '4x' | '8x'
export type PhotoMode = 'photo' | 'photo-compressed'
export type OnnxDevice = 'webgpu' | 'wasm' | 'cpu'
export type ChainKind = 'swin2sr' | 'realesrgan'

export const SWIN2SR_CLASSICAL_X2 = 'Xenova/swin2SR-classical-sr-x2-64'
export const SWIN2SR_COMPRESSED_X2 = 'Xenova/swin2SR-compressed-sr-x2-48'
export const SWIN2SR_REALWORLD_X4 = 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr'
export const REALESRGAN_X4 = 'realesr-general-x4v3'

export const REALESRGAN_LOCAL_URL = '/models/realesr-general-x4v3.onnx'
export const REALESRGAN_HF_URL =
  'https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx'

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

export function tileSettings(device: OnnxDevice): TileSettings {
  if (device === 'webgpu') return { tilePx: 256, overlap: 16, dtype: 'fp16' }
  return { tilePx: 128, overlap: 8, dtype: 'q8' }
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
      return {
        chains: [
          { modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' },
          { modelId: x2Model(mode), scale: 2, kind: 'swin2sr' },
        ],
        actualScale: 8,
      }
  }
}

export function swin2srFallbackRouting(scale: UpscaleScale, mode: PhotoMode): ModelRouting {
  switch (scale) {
    case '2x':
      return modelRouting(scale, mode)
    case '3x':
    case '4x':
      return { chains: [{ modelId: SWIN2SR_REALWORLD_X4, scale: 4, kind: 'swin2sr' }], actualScale: 4 }
    case '8x':
      return {
        chains: [
          { modelId: SWIN2SR_REALWORLD_X4, scale: 4, kind: 'swin2sr' },
          { modelId: x2Model(mode), scale: 2, kind: 'swin2sr' },
        ],
        actualScale: 8,
      }
  }
}
