import type { ViewerToolConfig } from '@/lib/types'
import type { AiDetectionResult } from '@/lib/converters/ai-detector.types'
import { analyzeForAi } from '@/lib/converters/ai-detector'
import { AiDetectorRoot } from '@/components/ai-detector/viewer-root'
import { AiDetectorExplainer } from '@/components/ai-detector/explainer'

export const config: ViewerToolConfig<AiDetectionResult> = {
  mode: 'viewer',
  slug: 'ai-image-detector',
  title: 'AI Image Detector',
  subtitle: 'Local-first AI-generated image detector. Built for batches.',
  bestFor: 'Best for spot-checking whether a photo was made by Midjourney, DALL·E, Stable Diffusion, Flux, or a camera — before publishing, moderating, or citing it.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif'],
  analyzeFn: analyzeForAi,
  renderResults: AiDetectorRoot,
  explainer: AiDetectorExplainer,
  faq: [
    {
      q: 'Does the image leave my browser?',
      a: 'No. The classifier and metadata parser run entirely on your device via WebAssembly/WebGPU. The image is decoded in the browser, resized, and passed to the model without any upload. You can verify this in your browser DevTools → Network tab.',
    },
    {
      q: 'Which AI generators does it detect?',
      a: 'The pixel classifier is trained on modern diffusion output — SDXL, Midjourney, DALL·E, Stable Diffusion 1.5/2.1/3, Flux, Ideogram, and Nano Banana — with lower confidence on older GAN images. The metadata pass separately detects Stable Diffusion, ComfyUI, Midjourney, DALL·E, Firefly, Imagen, Ideogram, Leonardo, Runway, and any C2PA Content Credentials.',
    },
    {
      q: 'How accurate is it?',
      a: 'Around 88% F1 on modern diffusion output. False positives occur on heavily edited photos, HDR composites, and skin-smoothed portraits. False negatives occur when an AI image has been re-encoded at low quality or run through an image-to-image pass. Use the verdict as one signal, not proof.',
    },
    {
      q: 'Can I check many images at once?',
      a: 'Yes — drop up to 1,000 images. The model loads once (about 130 MB, cached after first run) and each image is classified in 50–500 ms depending on your hardware. WebGPU is used when available with WebAssembly fallback.',
    },
    {
      q: 'What formats are supported?',
      a: 'JPEG, PNG, WebP, AVIF, and HEIC/HEIF. HEIC is decoded locally via a WASM decoder before classification.',
    },
    {
      q: 'Why did it flag my real photo as AI?',
      a: 'Heavily retouched portraits, HDR composites, and images that have been through generative upscalers or portrait beautifiers share statistical properties with diffusion output. Check the metadata panel — if no AI signatures are present and you know the origin, trust the source.',
    },
    {
      q: 'What if an AI image is missing metadata?',
      a: 'That is the common case — social platforms strip most metadata. The pixel classifier is designed for this scenario. If both metadata and the classifier come up clean, the image is either human-made or has been aggressively re-encoded past the classifier\'s detection threshold.',
    },
    {
      q: 'Can it detect deepfakes?',
      a: 'For stills, yes — the classifier catches diffusion-generated faces well. Face-swap deepfakes on video are a different problem and out of scope. For high-stakes still-image cases, combine the verdict with reverse-image search and provenance checks.',
    },
  ],
  relatedTools: ['exif-viewer', 'image-description', 'alt-text-generator', 'background-remover'],
  relatedArticles: [],
  meta: {
    title: 'Free AI Image Detector — Batch, In Browser | ConvertYard',
    description: 'Free AI image detector. Check if a photo was made by Midjourney, DALL·E, Stable Diffusion, or a camera — up to 1,000 files at once, all in your browser. No uploads.',
  },
}
