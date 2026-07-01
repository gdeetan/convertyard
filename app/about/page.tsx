import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why ConvertYard exists. We got tired of uploading files to random websites just to convert them.',
  openGraph: {
    title: 'About ConvertYard',
    description:
      'Why ConvertYard exists. We got tired of uploading files to random websites just to convert them.',
    url: 'https://convertyard.com/about',
  },
  alternates: {
    canonical: 'https://convertyard.com/about',
  },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        Why ConvertYard exists
      </h1>

      <div className="space-y-6 text-base leading-relaxed text-fg-muted">
        <p>
          Every time you upload a file to a random conversion website, you're trusting a stranger
          with your data. A contract, a medical record, a family photo, source code — it leaves
          your device and lands on an unknown server. Most sites are fine. Some aren't. None of
          them should need to see your file in the first place.
        </p>

        <p>
          The technology to do this better has existed for years. WebAssembly lets browsers run
          native code — the same C++ libraries that power professional desktop software — at near-native
          speed. libvips handles image conversion. ffmpeg handles video. pdf-lib handles PDFs. All of
          them compile to WASM and run inside a browser tab without any network round-trip.
        </p>

        <p>
          ConvertYard is the realization of that: every tool processes files locally in your browser.
          Your CPU does the work. Nothing uploads. Not for convenience, not "securely" — simply not
          at all. You can{' '}
          <a
            href="/#devtools-heading"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            verify this yourself
          </a>{' '}
          by watching your network tab during a conversion.
        </p>

        <p>
          The second thing we got tired of: conversion tools that only handle one file at a time.
          If you have 200 product images to convert, or 50 PDFs to merge, you don't want to babysit
          a single-file form for an hour. ConvertYard is batch-first. Every tool accepts as many
          files as you can drag in.
        </p>

        <h2 className="text-xl font-semibold text-fg mt-10 mb-4">What we're building</h2>

        <p>
          A network of local-first batch conversion tools covering images, PDFs, video, audio,
          developer utilities, and web tools. The goal is to replace every "upload to some random
          website" workflow with a version that never needs to leave your browser.
        </p>

        <p>
          Tools are free, supported by minimal display ads that appear only below tool content —
          never inside the conversion flow. There's no signup wall, no watermark, no artificial
          file limit designed to push you to a paid plan.
        </p>

        <h2 className="text-xl font-semibold text-fg mt-10 mb-4">Get in touch</h2>

        <p>
          If a tool is broken, a format isn't supported, or you have an idea —{' '}
          <a
            href="mailto:hello@convertyard.com"
            className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            hello@convertyard.com
          </a>
          .
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/how-it-works"
          className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          How it works technically →
        </Link>
        <Link
          href="/privacy"
          className="rounded-lg border border-border bg-bg-muted px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Privacy policy →
        </Link>
      </div>
    </div>
  )
}
