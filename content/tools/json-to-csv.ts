// content/tools/json-to-csv.ts
import { jsonToCsv } from '@/lib/converters/json-to-csv'
import type { TextToolConfig } from '@/lib/types-text'

export const config: TextToolConfig = {
  slug: 'json-to-csv',
  title: 'JSON to CSV Converter',
  subtitle: 'Convert JSON arrays to CSV. Preview before download. Entirely in your browser.',
  category: 'dev',
  inputLabel: 'Paste your JSON array',
  inputPlaceholder: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
  acceptsFile: ['application/json', 'text/plain'],
  acceptsFileExt: ['.json'],
  convertFn: jsonToCsv,
  options: [
    {
      type: 'radio',
      name: 'delimiter',
      label: 'Delimiter',
      choices: [
        { value: 'comma',     label: 'Comma (,)' },
        { value: 'tab',       label: 'Tab' },
        { value: 'semicolon', label: 'Semicolon (;)' },
      ],
      default: 'comma',
      hint: 'Use semicolon for European locales where comma is the decimal separator',
    },
    {
      type: 'toggle',
      name: 'includeHeaders',
      label: 'Include headers',
      default: true,
      hint: 'First row will contain column names derived from JSON keys',
    },
  ],
  outputLabel: 'CSV output',
  faq: [
    {
      q: 'What JSON structure does this converter accept?',
      a: 'A JSON array of objects — the most common format from APIs, e.g. [{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]. It also accepts a single plain object, which is wrapped in an array automatically.',
    },
    {
      q: 'How are nested objects handled?',
      a: 'Nested objects are flattened using dot notation. For example, {"user":{"name":"Alice","age":30}} becomes two columns: "user.name" and "user.age". This mirrors the behaviour of tools like jq and pandas json_normalize.',
    },
    {
      q: 'How are arrays inside objects handled?',
      a: 'Array values are joined with a pipe character (|). For example, {"tags":["js","ts"]} becomes a single column "tags" with value "js|ts". This preserves the data in a single cell without needing a separate join table.',
    },
    {
      q: 'When should I use semicolons instead of commas?',
      a: 'In many European countries, the comma is the decimal separator (e.g. 1,5 instead of 1.5). Spreadsheet apps in those locales — Excel Germany, LibreOffice on French Windows — default to semicolons as the CSV delimiter.',
    },
    {
      q: 'What is the preview table?',
      a: 'The preview table shows the first 10 rows of the CSV in a readable table format. The full CSV (all rows) is always included in the downloaded file.',
    },
    {
      q: 'Can I convert a CSV back to JSON?',
      a: 'Not with this tool — but a CSV to JSON converter is planned. It will parse any delimiter and output a JSON array of objects.',
    },
    {
      q: 'Is my data sent to a server?',
      a: 'No. All conversion happens in your browser. Your JSON is never uploaded anywhere. The tool works offline once the page has loaded.',
    },
  ],
  relatedTools: ['json-formatter', 'base64'],
  relatedArticles: [],
  meta: {
    title: 'JSON to CSV Converter — ConvertYard',
    description:
      'Convert JSON arrays to CSV in your browser. Flattens nested objects, joins arrays with pipe, previews first 10 rows before download. No uploads.',
  },
}
