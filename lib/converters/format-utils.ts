export function detectSameFormat(file: File): string {
  if (file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name)) return 'jpg'
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) return 'png'
  if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) return 'webp'
  if (file.type === 'image/avif' || /\.avif$/i.test(file.name)) return 'avif'
  if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) return 'gif'
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) return 'svg'
  return 'jpg'
}
