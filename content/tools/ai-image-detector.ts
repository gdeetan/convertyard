import type { ViewerToolConfig } from '@/lib/types'
import type { AiDetectionResult } from '@/lib/converters/ai-detector.types'
import { analyzeForAi } from '@/lib/converters/ai-detector'
import { AiDetectorRoot, ClassifierLoadHint } from '@/components/ai-detector/viewer-root'
import { AiDetectorExplainer } from '@/components/ai-detector/explainer'

export const config: ViewerToolConfig<AiDetectionResult> = {
  mode: 'viewer',
  slug: 'ai-image-detector',
  title: 'AI Image Detector',
  subtitle: 'Local-first AI-generated image detector. Built for batches.',
  bestFor: 'A first pass on whether an image was generated (ChatGPT, Flux, Midjourney, Stable Diffusion) or photographed. Nothing is uploaded.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif'],
  analyzeFn: analyzeForAi,
  renderResults: AiDetectorRoot,
  extraInput: ClassifierLoadHint,
  explainer: AiDetectorExplainer,
  faq: [
    {
      q: 'Does the image leave my browser?',
      a: 'No. Decode, classify, and metadata parse all run on your device. Nothing is uploaded. You can confirm that in DevTools → Network.',
    },
    {
      q: 'Which AI generators does it detect?',
      a: 'The pixel score is AI vs photograph. It covers a wide set of generators, including ChatGPT / GPT Image, Flux, Midjourney, and Stable Diffusion. It does not name the app. Metadata can still flag Stable Diffusion, ComfyUI, Midjourney, Firefly, Imagen, Ideogram, Leonardo, Runway, and C2PA tags when those tags are still in the file.',
    },
    {
      q: 'How accurate is it?',
      a: 'On public test sets it is around 90% at a 65% cutoff. ChatGPT images are in scope. A 100% score is still not proof. Heavy retouching on a real photo can look like AI. Saving a generated image as a small JPEG can hide it. Use the score with the metadata panel and your own judgment.',
    },
    {
      q: 'Why did a JPEG copy score lower than the PNG?',
      a: 'The classifier reads pixels, not the filename and not EXIF. JPEG compression changes those pixels, so the percentage can move a few points — or a lot, if the quality is low. Stripping EXIF does not hide a generated image by itself; social platforms already strip tags on most files.',
    },
    {
      q: 'Can I check many images at once?',
      a: 'Yes. Drop up to 1,000 files. The model loads once (about 87 MB, then cached). Desktops score five 384 px crops and average them; phones use one center crop.',
    },
    {
      q: 'What formats are supported?',
      a: 'JPEG, PNG, WebP, AVIF, and HEIC/HEIF. HEIC is decoded locally before classification.',
    },
    {
      q: 'Why did it flag my real photo as AI?',
      a: 'Retouched portraits, HDR composites, beauty filters, and generative upscalers share traits with generated images. If you know how the photo was made, trust that. Empty metadata does not prove it is real.',
    },
    {
      q: 'Can it detect deepfakes?',
      a: 'For stills, generated faces are usually in range. Face-swap video on real footage is a different problem and out of scope. For a high-stakes still, also reverse-image search and check the source.',
    },
  ],
  relatedTools: ['exif-viewer', 'image-description', 'alt-text-generator', 'background-remover'],
  relatedArticles: [],
  meta: {
    title: 'Free AI Image Detector — Batch, In Browser | ConvertYard',
    description: 'Free AI image detector. Check ChatGPT, Flux, Midjourney, Stable Diffusion, and camera photos — up to 1,000 files at once, all in your browser. No uploads.',
  },
}
