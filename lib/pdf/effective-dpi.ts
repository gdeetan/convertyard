export interface EffectiveDpiInput {
  /** Pixel width of the image XObject (from image dict Width). */
  pixelWidth: number;
  /** Width the image is actually drawn at, in PDF points (1 point = 1/72 inch). */
  renderedPoints: number;
}

/**
 * Effective source DPI of an image = pixelWidth / (renderedPoints / 72).
 * Returns Infinity when renderedPoints is 0 so the caller can treat that as
 * "unknown — skip downsampling for this image".
 */
export function computeEffectiveDpi(input: EffectiveDpiInput): number {
  if (input.renderedPoints <= 0) return Infinity;
  return (input.pixelWidth * 72) / input.renderedPoints;
}
