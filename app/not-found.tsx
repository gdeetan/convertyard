import Link from 'next/link'
import { tools } from '@/content/tool-registry'

export default function NotFound() {
  const popularTools = tools.slice(0, 6)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-medium text-blue-500 mb-4">404</p>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        Page not found
      </h1>
      <p className="text-slate-500 max-w-md mb-10">
        This page doesn't exist. Try one of the tools below or head back home.
      </p>

      {popularTools.length > 0 && (
        <div className="mb-10 w-full max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
            Popular tools
          </p>
          <ul className="flex flex-col gap-2">
            {popularTools.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${t.slug}/`}
                  className="block rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Go home
      </Link>
    </main>
  )
}
