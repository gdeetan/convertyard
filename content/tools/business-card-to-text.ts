import { imageOcrConvert } from '@/lib/converters/image-ocr'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'business-card-to-text',
  title: 'Business Card to Text Converter',
  subtitle: 'Scan business cards and extract contact details into CSV.',
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
      q: 'Does it extract email addresses and phone numbers automatically?',
      a: 'Yes. Email addresses, phone numbers, and URLs are detected using pattern matching and placed in separate columns. The raw text is also included if you need anything else.',
    },
    {
      q: 'Can I import the results into my contacts app?',
      a: 'The CSV output can be imported into Google Contacts, Apple Contacts, Outlook, Salesforce, HubSpot, or any CRM that accepts CSV. You may need to map the column names to your app\'s field names.',
    },
    {
      q: 'My business cards have a dark background with light text — will it work?',
      a: 'Yes. The tool pre-processes PNG files to handle contrast issues. For best results with dark-background cards, photograph or scan at high resolution.',
    },
    {
      q: 'How accurate is the contact information extraction?',
      a: 'Phone numbers and email addresses are detected using pattern matching, so they tend to come out reliably even when the surrounding text has errors. The harder parts are names (especially non-Western names or unusual spellings) and titles, which OCR can misread if the font is stylised or the card has a coloured background. Before importing the CSV into your CRM or contacts app, it\'s worth scanning down the name column — correcting five names now saves hunting for a contact you can\'t find in six months.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. OCR runs entirely in your browser. Your files never leave your device.',
    },
  ],

  relatedTools: ['receipt-to-text', 'scan-to-text', 'photo-to-text'],
  relatedArticles: [],

  meta: {
    title: 'Business Card to Text Converter — ConvertYard',
    description: 'Scan business cards and extract name, company, email, phone, and URL into CSV. Import directly into your CRM. Runs locally — no uploads.',
  },
}
