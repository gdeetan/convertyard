import type { ToolOptions } from '@/lib/types'

export async function svgCompress(file: File, opts: ToolOptions): Promise<File> {
  const { optimize } = await import('svgo')
  const source = await file.text()

  const stripMetadata = opts.stripMetadata !== false
  const result = optimize(source, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            ...(stripMetadata
              ? {}
              : { removeMetadata: false, removeDesc: false, removeTitle: false }),
          },
        },
      },
    ],
  })

  return new File([result.data], file.name, { type: 'image/svg+xml' })
}
