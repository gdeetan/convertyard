import * as pako from 'pako';

export interface DownsampleOptions {
  sourceWidth: number;
  sourceHeight: number;
  sourceDpi: number;
  targetDpi: number;
  colorSpace: 'DeviceRGB' | 'DeviceGray';
  bitsPerComponent: number;
  jpegQuality: number;
  flateLevel?: number; // 1–9. If set and source is kept as Flate, re-encode at this level.
}

export interface DownsampleResult {
  bytes: Uint8Array;
  width: number;
  height: number;
  filter: 'DCTDecode' | 'FlateDecode';
}

export async function downsampleFlateImage(
  compressed: Uint8Array,
  opts: DownsampleOptions
): Promise<DownsampleResult> {
  if (opts.sourceDpi <= opts.targetDpi) {
    if (opts.flateLevel && opts.flateLevel >= 1 && opts.flateLevel <= 9) {
      try {
        const raw = pako.inflate(compressed);
        const reencoded = pako.deflate(raw, { level: opts.flateLevel as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 });
        if (reencoded.byteLength < compressed.byteLength) {
          return {
            bytes: reencoded,
            width: opts.sourceWidth,
            height: opts.sourceHeight,
            filter: 'FlateDecode',
          };
        }
      } catch {
        // fall through and return the original bytes.
      }
    }
    return {
      bytes: compressed,
      width: opts.sourceWidth,
      height: opts.sourceHeight,
      filter: 'FlateDecode',
    };
  }

  const scale = opts.targetDpi / opts.sourceDpi;
  const newWidth = Math.max(1, Math.round(opts.sourceWidth * scale));
  const newHeight = Math.max(1, Math.round(opts.sourceHeight * scale));

  const raw = pako.inflate(compressed);
  const rgba = expandToRgba(
    raw,
    opts.sourceWidth,
    opts.sourceHeight,
    opts.colorSpace,
    opts.bitsPerComponent
  );

  const srcCanvas = createCanvas(opts.sourceWidth, opts.sourceHeight);
  const srcCtx = srcCanvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!srcCtx) throw new Error('Canvas 2d context unavailable');
  const imageData =
    typeof ImageData !== 'undefined'
      ? new ImageData(rgba, opts.sourceWidth, opts.sourceHeight)
      : (srcCtx as CanvasRenderingContext2D).createImageData(
          opts.sourceWidth,
          opts.sourceHeight
        );
  if (typeof ImageData === 'undefined') {
    (imageData as ImageData).data.set(rgba);
  }
  srcCtx.putImageData(imageData as ImageData, 0, 0);

  const dstCanvas = createCanvas(newWidth, newHeight);
  const dstCtx = dstCanvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!dstCtx) throw new Error('Canvas 2d context unavailable');
  (dstCtx as CanvasRenderingContext2D).drawImage(
    srcCanvas as CanvasImageSource,
    0,
    0,
    newWidth,
    newHeight
  );

  const blob = await canvasToBlob(dstCanvas, 'image/jpeg', opts.jpegQuality);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, width: newWidth, height: newHeight, filter: 'DCTDecode' };
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }
  throw new Error('No canvas implementation available');
}

function canvasToBlob(
  canvas: AnyCanvas,
  type: string,
  quality: number
): Promise<Blob> {
  if ('convertToBlob' in canvas && typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      type,
      quality
    );
  });
}

function expandToRgba(
  raw: Uint8Array,
  width: number,
  height: number,
  colorSpace: 'DeviceRGB' | 'DeviceGray',
  bitsPerComponent: number
): Uint8ClampedArray {
  if (bitsPerComponent !== 8) {
    throw new Error(`Unsupported bitsPerComponent: ${bitsPerComponent}`);
  }
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (colorSpace === 'DeviceRGB') {
    for (let i = 0, j = 0; i < raw.length; i += 3, j += 4) {
      rgba[j] = raw[i];
      rgba[j + 1] = raw[i + 1];
      rgba[j + 2] = raw[i + 2];
      rgba[j + 3] = 255;
    }
  } else {
    for (let i = 0, j = 0; i < raw.length; i++, j += 4) {
      rgba[j] = raw[i];
      rgba[j + 1] = raw[i];
      rgba[j + 2] = raw[i];
      rgba[j + 3] = 255;
    }
  }
  return rgba;
}
