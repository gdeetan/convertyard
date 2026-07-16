import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'
import { OcrReviewPanel } from '@/components/ocr-review'

export const config: ToolConfig = {
  slug: 'jpeg-to-text',
  title: 'JPEG to Text Converter',
  subtitle: 'Extract text from JPEG files. Same as JPG, just spelled differently.',
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
      q: 'What\'s the difference between JPEG and JPG?',
      a: 'Nothing. JPEG is the full name of the format; JPG is the three-letter extension used on Windows where extensions were historically limited to three characters. The files are identical.',
    },
    {
      q: 'Is this the same as the JPG to Text tool?',
      a: 'Yes, exactly the same functionality. Both accept .jpg and .jpeg files.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'There is no hard limit. For large batches (50+ files), processing continues in the background — keep the tab open until it finishes.',
    },
    {
      q: 'Is the output accurate enough to use directly?',
      a: 'For most clean document scans, yes — but "most" is doing real work in that sentence. JPEG compression chews up fine details like thin serifs, punctuation, and small numbers. The higher the compression (the smaller the file), the more errors you\'ll see. It\'s worth doing a read-through of anything you plan to paste into a document, email, or form before you hit send. The review panel helps by flagging the words the engine had the most trouble with.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your files never leave your device.',
    },
  ],

  relatedTools: ['jpg-to-text', 'png-to-text', 'photo-to-text'],
  relatedArticles: [],

  meta: {
    title: 'JPEG to Text Converter — ConvertYard',
    description: 'Extract text from JPEG files with free browser-based OCR. No uploads, no account. 14 languages, batch processing.',
  },
}
