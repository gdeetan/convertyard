export function detectSameFormat(file: File): string {
  if (file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name)) return 'jpg'
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) return 'png'
  if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) return 'webp'
  return 'jpg'
}
