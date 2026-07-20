import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'jpeg-to-text',
  title: 'JPEG to Text Converter',
  subtitle: 'Extract text from JPEG files. Same as JPG, just spelled differently.',
  bestFor: 'Best for extracting text from JPEG images when tools or scripts specifically require .jpeg files.',
  category: 'image-to-text',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpeg', '.jpg'],
  outputExt: '.txt',
  convertFn: (files, opts, onProgress) => imageOcrConvert(files, opts, onProgress),
  reviewPanel: OcrReviewPanel,

  limitationNote: {
    summary: 'OCR is CPU-intensive',
    body: 'Text recognition runs on your device. Expect a few seconds per image.',
  },

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown in the image.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'hin', label: 'Hindi' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'chi_tra', label: 'Chinese (Traditional)' },
        { value: 'ara', label: 'Arabic' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'rus', label: 'Russian' },
        { value: 'ita', label: 'Italian' },
        { value: 'nld', label: 'Dutch' },
      ],
      default: 'eng',
    },
    {
      type: 'radio',
      name: 'outputMode',
      label: 'Output format',
      choices: [
        { value: 'text', label: 'Plain text (.txt)' },
        { value: 'markdown', label: 'Markdown (.md)' },
        { value: 'combined', label: 'Combined single file' },
      ],
      default: 'text',
      conditionalHints: {
        text: 'One .txt file per image.',
        markdown: 'One .md file per image.',
        combined: 'All images merged into one .txt file.',
      },
    },
    {
      type: 'toggle' as const,
      name: 'autoCorrect',
      label: 'Fix common OCR errors',
      hint: 'Fixes classic OCR mistakes (rn→m, O→0, etc.) using a dictionary. Only touches low-confidence words — revertible in the review panel.',
      default: true,
      dependsOn: { name: 'language', value: 'eng' },
    },
  ],

  faq: [
    {
      q: 'Are my JPEG files uploaded anywhere to run OCR?',
      a: 'No. OCR runs entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'What\'s the difference between JPEG and JPG?',
      a: 'Nothing meaningful. JPEG is the full format name; JPG is the three-letter extension that became common on Windows when extensions were limited to three characters. The files are identical — this tool accepts both.',
    },
    {
      q: 'Does JPEG compression hurt OCR accuracy?',
      a: 'At moderate quality (70%+) you won\'t notice a difference. Heavy compression creates ringing artefacts around letter edges that confuse character recognition — thin serifs, punctuation, and small numbers are the first things to suffer. If you have a choice, export at 80%+ quality.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'There is no hard limit. For large batches (50+ files), processing runs in the background — keep the tab open until it finishes.',
    },
    {
      q: 'Should I review the output before using it?',
      a: 'For most clean document scans the output is usable directly, but check anything you plan to paste into a form, email, or legal document. The review panel flags words the engine had low confidence on — those are the most likely errors.',
    },
  ],

  relatedTools: ['jpg-to-text', 'png-to-text', 'photo-to-text'],
  relatedArticles: [],

  meta: {
    title: 'JPEG to Text Converter — ConvertYard',
    description: 'Extract text from JPEG files with free browser-based OCR. No uploads, no account. 14 languages, batch processing.',
  },
}
