// content/tools/json-formatter.ts
import { formatJson } from '@/lib/converters/json-formatter'
import type { TextToolConfig } from '@/lib/types-text'

export const config: TextToolConfig = {
  slug: 'json-formatter',
  title: 'JSON Formatter & Validator',
  subtitle: 'Format, validate, and minify JSON. Shareable URLs. Entirely in your browser.',
  category: 'dev',
  inputLabel: 'Paste your JSON',
  inputPlaceholder: '{ "name": "ConvertYard", "tools": 60 }',
  acceptsFile: ['application/json', 'text/plain'],
  acceptsFileExt: ['.json'],
  convertFn: formatJson,
  options: [
    {
      type: 'radio',
      name: 'indent',
      label: 'Indent',
      choices: [
        { value: '2', label: '2 spaces' },
        { value: '4', label: '4 spaces' },
        { value: 'tab', label: 'Tab' },
      ],
      default: '2',
    },
    {
      type: 'toggle',
      name: 'sortKeys',
      label: 'Sort keys',
      default: false,
      hint: 'Sort object keys alphabetically at every level',
    },
    {
      type: 'toggle',
      name: 'minify',
      label: 'Minify',
      default: false,
      hint: 'Remove all whitespace for the smallest possible output',
    },
  ],
  enableUrlHash: true,
  outputLabel: 'Formatted JSON',
  faq: [
    {
      q: 'What does the JSON formatter do?',
      a: 'It parses your JSON and re-serialises it with consistent indentation, making it easy to read. If your JSON has a syntax error, it shows you the exact line and column where the problem is.',
    },
    {
      q: 'Is my data sent to a server?',
      a: 'No. The formatter runs entirely in your browser using JavaScript. Your JSON never leaves your device — there are no uploads, no logging, and no accounts required.',
    },
    {
      q: 'What is the difference between 2-space, 4-space, and tab indentation?',
      a: '2-space indent is the most common choice in JavaScript codebases. 4-space is preferred in many Python and Java projects. Tab indentation uses a literal tab character (\\t), which allows each developer to set their preferred display width in their editor.',
    },
    {
      q: 'What does "Sort keys" do?',
      a: "When enabled, every object's keys are sorted alphabetically before output. This is useful for comparing two JSON objects (diffing), committing config files to version control, or producing consistent output regardless of the original key order.",
    },
    {
      q: 'What does minify do?',
      a: 'Minification removes all unnecessary whitespace — newlines, spaces between tokens — producing the most compact valid JSON string. Use this before putting JSON into HTTP responses or config files where size matters.',
    },
    {
      q: 'Can I share a pre-filled link to this formatter?',
      a: "Yes. Your input is encoded in the URL hash (the part after #) as you type. Copy the URL from your browser's address bar to share a link that will automatically fill the input when opened.",
    },
    {
      q: 'What causes a JSON parse error?',
      a: 'Common causes: trailing commas ({"a":1,} is invalid JSON), single-quoted strings (only double quotes are valid), unquoted keys ({name:"value"} is not JSON), comments (JSON does not support // or /* */), and missing commas between items.',
    },
    {
      q: 'What is the maximum size of JSON I can format?',
      a: "There is no hard limit — it is bounded by your browser's available memory. Files up to tens of megabytes format instantly. Very large files (>100 MB) may slow the browser tab during parsing.",
    },
  ],
  relatedTools: ['json-to-csv', 'base64'],
  relatedArticles: [],
  meta: {
    title: 'JSON Formatter & Validator — ConvertYard',
    description:
      'Format, validate, and minify JSON in your browser. Syntax highlighting, error location, sort keys, shareable links. No uploads, no accounts.',
  },
}
