'use client'
import { useState, useCallback, useRef } from 'react'
import { getPdfFormFields, fillPdfForm, type FormField } from '@/lib/converters/pdf'
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
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (f) loadFile(f)
  }, [loadFile])

  const reset = useCallback(() => {
    setPhase('idle')
    setFile(null)
    setFields([])
    setValues({})
    setResultUrl(null)
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">{config.title}</h1>
      <p className="text-gray-500 mb-6">{config.subtitle}</p>

      {/* Drop zone */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 transition-colors mb-6"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
          {phase === 'loading'
            ? <p className="text-gray-500">Reading form fields…</p>
            : (
              <>
                <p className="text-lg font-medium mb-1">Drop a PDF form here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </>
            )
          }
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

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {config.faq?.map((item, i) => (
            <details key={i} className="border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-sm">{item.q}</summary>
              <p className="px-4 pb-4 text-gray-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
