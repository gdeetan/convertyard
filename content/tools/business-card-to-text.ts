import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'business-card-to-text',
  title: 'Business Card to Text Converter',
  subtitle: 'Scan business cards and extract contact details into CSV.',
  bestFor: 'Best for quickly capturing contact details from physical business cards collected at events.',
  category: 'image-to-text',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: (files, opts, onProgress) =>
    imageOcrConvert(files, { ...opts, outputMode: 'card-csv' }, onProgress),

  options: [
    {
      type: 'dropdown',
      name: 'language',
      label: 'Language',
      hint: 'Pick the language shown on the card.',
      choices: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'chi_tra', label: 'Chinese (Traditional)' },
        { value: 'jpn', label: 'Japanese' },
        { value: 'kor', label: 'Korean' },
        { value: 'ara', label: 'Arabic' },
      ],
      default: 'eng',
    },
  ],

  faq: [
    {
      q: 'Are my business card photos uploaded anywhere?',
      a: 'No. OCR runs locally in your browser. Your images never leave your device.',
    },
    {
      q: 'Does the output give me structured contact fields (name, email, phone)?',
      a: 'The CSV has separate columns for detected email addresses, phone numbers, and URLs — extracted using pattern matching. Name and title are not reliably separated from the rest of the card text; they appear in the raw text column. You will need to assign those fields manually in your contacts app.',
    },
    {
      q: 'What kind of business cards work best?',
      a: 'Cards with high contrast — black or dark text on a white or light background — and a standard font work best. Cards with foil effects, embossed text, very small print, or light text on a coloured background are harder to read accurately.',
    },
    {
      q: 'The OCR missed part of the card or got letters wrong. What helps?',
      a: 'Take the photo in good natural light, parallel to the card surface, with no flash glare. Avoid shadows across the card. A photo taken at an angle or in low light is the most common reason for poor output.',
    },
    {
      q: 'Can I import the CSV into my CRM or contacts app?',
      a: 'Yes. The CSV imports into Google Contacts, Apple Contacts, Outlook, Salesforce, HubSpot, and any app that accepts CSV. You may need to map column names to your app\'s field names — the exact labels vary by app.',
    },
  ],

  relatedTools: ['receipt-to-text', 'scan-to-text', 'photo-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Business Card to Text Converter — ConvertYard',
    description: 'Scan business cards and extract name, company, email, phone, and URL into CSV. Import directly into your CRM. Runs locally — no uploads.',
  },
}
