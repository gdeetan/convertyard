'use client'
import { useState, useCallback } from 'react'
import { Lock } from 'lucide-react'
import { getPdfFormFields, fillPdfForm, type FormField } from '@/lib/converters/pdf'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { config } from '@/content/tools/fill-pdf-form'

type Phase = 'idle' | 'loading' | 'filling' | 'done'

export default function FillPdfFormPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [flatten, setFlatten] = useState(true)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    try {
      const formFields = await getPdfFormFields(f)
      const initialValues: Record<string, string | boolean> = {}
      for (const field of formFields) {
        initialValues[field.name] = field.type === 'checkbox'
          ? (field.defaultValue as boolean) ?? false
          : (field.defaultValue as string) ?? ''
      }
      setFields(formFields)
      setValues(initialValues)
      setPhase('filling')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read form fields')
      setPhase('idle')
    }
  }, [])

  const handleFill = useCallback(async () => {
    if (!file) return
    setSubmitting(true)
    setError(null)
    try {
      const outFile = await fillPdfForm(file, values, flatten)
      setResultUrl(URL.createObjectURL(outFile))
      setResultName(outFile.name)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill form')
    } finally {
      setSubmitting(false)
    }
  }, [file, values, flatten])

  const reset = useCallback(() => {
    setPhase('idle')
    setFile(null)
    setFields([])
    setValues({})
    setResultUrl(null)
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/pdf' },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.title}</h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Files never leave your browser. No uploads. No accounts.
        </div>
      </div>

      {/* Drop zone */}
      {phase === 'loading' && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm mb-6">
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-fg-muted">Reading form fields…</p>
          </div>
        </div>
      )}
      {phase === 'idle' && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm mb-6">
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={(files) => { if (files[0]) loadFile(files[0]) }}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Field form */}
      {phase === 'filling' && (
        <>
          {fields.length === 0 ? (
            <div className="border rounded-xl p-6 mb-6 text-center bg-gray-50">
              <p className="font-medium mb-1">No fillable fields found</p>
              <p className="text-sm text-gray-500">
                This PDF has no AcroForm fields. It may be a flat document or a scanned PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-5 mb-6 max-h-[600px] overflow-y-auto pr-1">
              {fields.map((field) => {
                const label = field.name.length > 60 ? field.name.slice(0, 60) + '…' : field.name
                return (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700" title={field.name}>
                      {label}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={values[field.name] as string ?? ''}
                        onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    )}
                    {field.type === 'checkbox' && (
                      <input
                        type="checkbox"
                        checked={values[field.name] as boolean ?? false}
                        onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    )}
                    {field.type === 'radio' && field.options && (
                      <div className="flex flex-wrap gap-4">
                        {field.options.map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={field.name}
                              value={opt}
                              checked={values[field.name] === opt}
                              onChange={() => setValues(v => ({ ...v, [field.name]: opt }))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {field.type === 'dropdown' && field.options && (
                      <select
                        value={values[field.name] as string ?? ''}
                        onChange={(e) => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select…</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Flatten form</span>
              <span className="text-gray-400">(recommended — locks answers, prevents editing)</span>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFill}
                disabled={submitting || fields.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium text-sm"
              >
                {submitting ? 'Filling…' : 'Fill & Download'}
              </button>
              <button onClick={reset} className="text-sm text-gray-500 hover:underline">
                Load different file
              </button>
            </div>
          </div>
        </>
      )}

      {/* Done */}
      {phase === 'done' && resultUrl && (
        <div className="border rounded-xl p-6 mb-6">
          <p className="text-green-700 text-sm mb-4 flex items-center gap-1.5">
            <span>✓</span>
            <span>Form filled successfully</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={resultUrl}
              download={resultName}
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Download {resultName}
            </a>
            <button onClick={reset} className="text-sm text-gray-500 hover:underline self-center">
              Fill another file
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">How it works</h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
          {[
            { n: '1', label: 'Drop your PDF form', desc: 'Drag and drop, click to browse, or paste from clipboard. All AcroForm fields are detected automatically.' },
            { n: '2', label: 'Fill in the fields', desc: 'Text fields, checkboxes, radio buttons, and dropdowns are shown as editable inputs.' },
            { n: '3', label: 'Flatten (optional)', desc: 'Flattening locks your answers into the PDF, preventing further edits — recommended before sharing.' },
            { n: '4', label: 'Download', desc: 'Save the filled PDF directly to your device. No data leaves your browser.' },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">{step.n}</span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      {config.faq && config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}

      {/* Related tools */}
      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}
    </div>
  )
}
