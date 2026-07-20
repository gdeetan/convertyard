// content/tools/base64.ts
import { convertBase64, fileToBase64Text } from '@/lib/converters/base64'
import type { TextToolConfig } from '@/lib/types-text'

export const config: TextToolConfig = {
  slug: 'base64',
  title: 'Base64 Encoder / Decoder',
  subtitle: 'Encode and decode Base64 strings and files. URL-safe mode. All in your browser.',
  bestFor: 'Best for developers embedding binary data in HTML/CSS data URIs, inspecting JWT tokens, or decoding Base64 API responses.',
  category: 'dev',
  inputLabel: 'Paste text or load a file',
  inputPlaceholder: 'Hello, ConvertYard!',
  acceptsFile: ['*/*'],
  acceptsFileExt: ['any file'],
  convertFn: convertBase64,
  fileToTextFn: fileToBase64Text,
  options: [
    {
      type: 'radio',
      name: 'mode',
      label: 'Mode',
      choices: [
        { value: 'encode', label: 'Encode' },
        { value: 'decode', label: 'Decode' },
      ],
      default: 'encode',
    },
    {
      type: 'toggle',
      name: 'urlSafe',
      label: 'URL-safe',
      default: false,
      hint: 'Use - and _ instead of + and /, omit padding =',
    },
  ],
  enableAutoDetect: true,
  outputLabel: 'Output',
  faq: [
    {
      q: 'What is Base64 encoding?',
      a: 'Base64 is a binary-to-text encoding scheme that represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, +, /). It is commonly used to embed binary data — images, files, cryptographic keys — in text formats like JSON, XML, HTML, CSS, and email.',
    },
    {
      q: 'When would I encode a file to Base64?',
      a: 'Common use cases: embedding images directly in HTML or CSS as data URIs, attaching files in email (MIME), storing binary blobs in JSON APIs, and transmitting binary data over text-only protocols.',
    },
    {
      q: 'What is URL-safe Base64?',
      a: 'Standard Base64 uses + and / characters, which have special meaning in URLs. URL-safe Base64 replaces + with -, / with _, and removes the padding = characters. Use URL-safe mode when the Base64 string will appear in a URL, cookie, or JWT token.',
    },
    {
      q: 'How does decoding work?',
      a: 'The decoder converts a Base64 string back to its original text (UTF-8). If the input is not valid Base64, an error is shown. Common issues include missing padding (=) and characters not in the Base64 alphabet.',
    },
    {
      q: 'Why does the output sometimes contain non-printable characters?',
      a: 'When decoding Base64 that originated from binary data (images, executables) rather than text, the decoded bytes may not form valid UTF-8. In that case, download the output as a file rather than copying as text.',
    },
    {
      q: 'Is Base64 encryption?',
      a: 'No. Base64 is encoding, not encryption. Anyone with the encoded string can decode it instantly — it provides no confidentiality. If you need to protect data, use proper encryption (AES, etc.).',
    },
    {
      q: 'What does the auto-detect feature do?',
      a: 'When you are in Encode mode and your input looks like a valid Base64 string (all Base64 characters, length divisible by 4), the tool suggests switching to Decode mode. This prevents accidentally double-encoding already-encoded data.',
    },
  ],
  relatedTools: ['json-formatter', 'json-to-csv'],
  relatedArticles: [],
  meta: {
    title: 'Base64 Encoder / Decoder — ConvertYard',
    description:
      'Encode text or files to Base64, or decode Base64 strings. URL-safe mode, file upload, auto-detect. Runs entirely in your browser.',
  },
}
