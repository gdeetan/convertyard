# Build a Browser-Based Image Compression Previewer with libvips-wasm

*You're optimizing textures for a WebGL scene. You need to know: quality 60 or quality 75? The answer depends on the specific image — but to find out, you're exporting, switching apps, zooming in, switching back, tweaking, and doing it again. This tutorial builds the tool that eliminates that loop.*

We're going to build a drag-in compression previewer that runs entirely in the browser. No server, no file uploads. The image never leaves the machine. You get a split-view compare with pixel-level zoom, a real-time quality slider, and an optional size-targeting mode that steps down quality until it hits "under 100KB."

---

## 1. The Problem

Compression settings are trial and error. You pick a quality value based on intuition, encode, squint at the result, re-export, and repeat. The feedback loop is slow because it spans multiple tools and multiple context switches.

For WebGL/Three.js texture work the problem is sharper than usual. Texture quality hits performance (VRAM, bandwidth, draw time) and visual fidelity simultaneously, and the right quality setting varies by image — a gradient background tolerates heavy compression, a normal map does not. The only way to know is to look. And to look, you need to be zoomed in at the exact resolution the engine will sample.

What we need is a previewer that answers "quality 60 or quality 75?" inside the browser, at the actual pixel level, without leaving the tab.

---

## 2. The Idea

The core design constraint is local-first: the image never leaves the machine. That rules out server-side encoding and any upload-based approach. It also means the tool has to be fast enough to feel interactive, which rules out running the encoder on the main thread.

libvips is one of the fastest image processing libraries available. wasm-vips packages it for the browser via WebAssembly. Put libvips in a Web Worker, wire the output to a canvas split-view, and you have a tight encode-and-compare loop that runs entirely in-browser at native speed.

The split-view is the part that earns its keep for texture work specifically. You're not just checking whether an image looks "good" — you're checking whether blocking artifacts appear in the roughness channel at the zoom level your scene actually samples. That's a different question, and it needs pixel-level access, not a thumbnail.

---

## 3. Architecture

Two threads, strict separation.

The **main thread** handles the UI: the dropzone, the quality slider, canvas rendering, and the split-view divider. It never touches the WASM encoder.

The **Web Worker** owns libvips-wasm. It receives an `ArrayBuffer` (the raw file bytes), encodes it at the requested quality, and posts back an `ArrayBuffer` (the compressed result). The main thread turns that result into a `Blob`, measures its byte length, renders it to canvas, and updates the UI.

```
Main thread                     Worker
──────────────────────────────────────────────────────
File → ArrayBuffer ──────────────────────→ decode + encode
                                           (libvips-wasm)
Blob ← ArrayBuffer ←─────────────────────  encoded bytes
render to canvas
update size display
```

The canvas is only for the compare preview — it plays no role in the encode pipeline. If you later want to offer a download, create the `Blob` from the worker's output directly; don't round-trip through the canvas.

Why strict separation? WASM initialisation on the main thread stalls paint for 200–400ms on first load. That's the frame budget for your entire LCP. Put it in a Worker and the UI stays responsive while libvips boots.

---

## 4. Loading libvips-wasm in a Worker

Install the package:

```bash
npm install wasm-vips
```

The Worker file:

```js
// compress-worker.js
import Vips from 'wasm-vips';

let vips = null;

async function getVips() {
  if (!vips) {
    vips = await Vips({
      // Prevent wasm-vips from trying to use SharedArrayBuffer.
      // Safe default for environments without COOP/COEP headers.
      dynamicLibraries: [],
    });
  }
  return vips;
}

self.onmessage = async (e) => {
  const { buffer, format, quality, scale = 1, strip = true, id } = e.data;

  self.postMessage({ id, type: 'progress', value: 10 });

  const v = await getVips();

  self.postMessage({ id, type: 'progress', value: 30 });

  let image = v.Image.newFromBuffer(buffer);

  if (scale !== 1) {
    const scaled = image.resize(scale);
    image.delete();
    image = scaled;
  }

  self.postMessage({ id, type: 'progress', value: 50 });

  const outputBuffer = image.writeToBuffer(`.${format}`, { Q: quality, strip });

  self.postMessage({ id, type: 'progress', value: 95 });

  self.postMessage(
    { id, type: 'result', buffer: outputBuffer.buffer },
    [outputBuffer.buffer]
  );

  image.delete();
};
```

On the main thread, instantiate the Worker once and reuse it:

```js
const worker = new Worker(
  new URL('./compress-worker.js', import.meta.url),
  { type: 'module' }
);

let pendingId = 0;
const pending = new Map();

function compress(file, format, quality, { strip = true, scale = 1 } = {}) {
  return new Promise(async (resolve, reject) => {
    const id = ++pendingId;
    const buffer = await file.arrayBuffer();
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, buffer, format, quality, strip, scale }, [buffer]);
  });
}

function compressScaled(file, format, quality, scale) {
  return compress(file, format, quality, { scale });
}

worker.onmessage = (e) => {
  const { id, type, value, buffer } = e.data;
  const p = pending.get(id);
  if (!p) return;

  if (type === 'progress') {
    // update your progress UI here
  } else if (type === 'result') {
    pending.delete(id);
    p.resolve(new Blob([buffer]));
  }
};
```

Two things to note. First, we transfer the `ArrayBuffer` to the worker (the `[buffer]` in `postMessage`) — this is a zero-copy transfer that avoids duplicating potentially large image data. Second, the `image.delete()` call at the end of the worker handler is mandatory. Vips allocates from WASM linear memory; if you skip the explicit free you'll leak that memory across compression calls.

---

## 5. The PNG Quality Trap

Before wiring up the quality slider, there's a misconception worth stopping for: **PNG quality does not control visual fidelity.**

PNG is a lossless format. The quality setting in libvips (and most encoders) controls compression *effort* — how many passes the DEFLATE algorithm takes. A PNG at Q=10 looks byte-for-byte identical to a PNG at Q=100. It just encodes faster. Showing a "quality" slider to users for PNG outputs is actively misleading.

For lossless formats, the lever that actually matters for file size is **metadata stripping**. EXIF data, ICC color profiles, and embedded thumbnails can account for 20–80KB of a file that looks small on disk. Setting `strip: true` in the wasm-vips encode options removes all of this. For a PNG used as a WebGL texture, you almost certainly want to strip: the GPU doesn't use EXIF, and the browser ignores ICC on canvas-rendered images.

You can surface this as a byte-level breakdown in your UI:

```js
async function pngBreakdown(file) {
  const originalBlob = await compress(file, 'png', 100, { strip: false });
  const strippedBlob = await compress(file, 'png', 100, { strip: true });

  return {
    totalSize: originalBlob.size,
    strippedSize: strippedBlob.size,
    metadataBytes: originalBlob.size - strippedBlob.size,
  };
}
```

Show users "22KB of this file is metadata" and the click-to-strip becomes obvious.

For JPEG, WebP, and AVIF, quality maps directly to lossy compression — the slider is meaningful and should be exposed.

---

## 6. The Two-Phase Size-Targeting Algorithm

Quality sliders are useful for developers who already have intuition. For everyone else, the useful question is "what quality setting gets me under 100KB?"

A naive binary search on quality doesn't work reliably for AVIF. The relationship between vips quality setting and output file size is non-monotonic at low settings — quality 15 can produce a *larger* file than quality 20 depending on the image content and the encoder's internal quantization decisions. Binary search assumes monotonicity and will give wrong answers in this region.

The approach that works is a two-phase descent:

**Phase 1: Walk quality down in steps.**

```js
async function findQualityForTargetSize(file, format, targetBytes) {
  const steps = [80, 70, 60, 50, 40, 30, 20];

  for (const q of steps) {
    const blob = await compress(file, format, q);
    if (blob.size <= targetBytes) {
      return { blob, quality: q, scaled: false };
    }
  }

  // Still over target after Phase 1 — fall through to Phase 2
  return null;
}
```

**Phase 2: Fall back to dimension reduction.**

If the image won't fit under the target at any quality setting (or if it's PNG, which has no lossy quality axis), reduce the dimensions:

```js
async function findScaleForTargetSize(file, format, targetBytes) {
  const scales = [0.9, 0.8, 0.7, 0.6, 0.5];

  for (const scale of scales) {
    const blob = await compressScaled(file, format, 80, scale);
    if (blob.size <= targetBytes) {
      return { blob, scale, quality: 80 };
    }
  }

  return null; // can't hit target even at 50% dimensions
}
```

The full targeting function chains them:

```js
async function targetFileSize(file, format, targetBytes) {
  const isPng = format === 'png';

  if (!isPng) {
    const phaseOne = await findQualityForTargetSize(file, format, targetBytes);
    if (phaseOne) return phaseOne;
  }

  // Phase 2: dimension reduction
  return findScaleForTargetSize(file, format, targetBytes);
}
```

In practice, Phase 2 is rarely reached for JPEG and WebP. For AVIF it's more common at aggressive targets. For PNG it's always Phase 2, by definition.

---

## 7. The Split-View UI

The split-view is where this tool becomes genuinely useful for texture work. You need to see the original and compressed images side-by-side at identical zoom levels, with a draggable divider between them. A CSS `clip-path` trick works for the basic case, but breaks down once you add zoom and pan — so we'll use two canvas elements clipped to their respective halves.

**The divider drag:**

Don't use a range input. You need pixel-level precision, and range inputs introduce quantization that makes the divider feel sluggish at high zoom. Use a `pointermove` handler directly:

```js
let dividerX = containerWidth / 2;
let isDragging = false;

divider.addEventListener('pointerdown', (e) => {
  isDragging = true;
  divider.setPointerCapture(e.pointerId);
});

window.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  const rect = container.getBoundingClientRect();
  dividerX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  render();
});

window.addEventListener('pointerup', () => { isDragging = false; });
```

**Wheel zoom centered on the cursor:**

```js
let zoom = 1;
let panX = 0;
let panY = 0;

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const cursorX = e.clientX - rect.left;
  const cursorY = e.clientY - rect.top;

  const prevZoom = zoom;
  zoom = Math.max(1, Math.min(10, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));

  // Adjust pan so the point under the cursor stays fixed
  panX = cursorX - (cursorX - panX) * (zoom / prevZoom);
  panY = cursorY - (cursorY - panY) * (zoom / prevZoom);

  clampPan();
  render();
}, { passive: false });

function clampPan() {
  const maxX = Math.max(0, (imageWidth * zoom - canvasWidth) / 2);
  const maxY = Math.max(0, (imageHeight * zoom - canvasHeight) / 2);
  panX = Math.max(-maxX, Math.min(maxX, panX));
  panY = Math.max(-maxY, Math.min(maxY, panY));
}
```

**Checkerboard for transparency:**

Render the checkerboard pattern once to an offscreen canvas, then use it as the background fill before drawing any image:

```js
function makeCheckerboard(size = 8) {
  const c = new OffscreenCanvas(size * 2, size * 2);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, 0, size * 2, size * 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillRect(size, size, size, size);
  return c;
}

const checker = makeCheckerboard();

function render() {
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // Checkerboard fill
  const pattern = ctx.createPattern(checker, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, imageWidth, imageHeight);

  // Draw image
  ctx.drawImage(imageBitmap, 0, 0);
  ctx.restore();

  // Clip right half to compressed image
  ctx.save();
  ctx.beginPath();
  ctx.rect(dividerX, 0, canvasWidth - dividerX, canvasHeight);
  ctx.clip();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);
  ctx.drawImage(compressedBitmap, 0, 0);
  ctx.restore();

  // Draw divider line
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dividerX, 0);
  ctx.lineTo(dividerX, canvasHeight);
  ctx.stroke();
}
```

This is where the previewer earns its keep for texture work: zoom to 4× on a problematic region, drag the divider, and see blocking artifacts emerge at the exact pixel level.

---

## 8. Putting It Together

Here's the wiring that connects all the pieces: drop handler, slider, format selector, and download button.

```js
const dropzone = document.getElementById('dropzone');
const qualitySlider = document.getElementById('quality');
const formatSelect = document.getElementById('format');
const sizeLabel = document.getElementById('size-label');
const downloadBtn = document.getElementById('download');

let currentFile = null;
let currentBlob = null;
let compressedBitmap = null;

dropzone.addEventListener('dragover', (e) => e.preventDefault());
dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;

  currentFile = file;

  // Load original into canvas immediately — no encode needed
  const originalBitmap = await createImageBitmap(file);
  imageWidth = originalBitmap.width;
  imageHeight = originalBitmap.height;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  imageBitmap = originalBitmap;

  await recompress();
});

qualitySlider.addEventListener('input', recompress);
formatSelect.addEventListener('change', recompress);

async function recompress() {
  if (!currentFile) return;

  const format = formatSelect.value;
  const quality = Number(qualitySlider.value);

  // Hide quality slider for PNG — it's meaningless (see section 5)
  qualitySlider.disabled = format === 'png';

  currentBlob = await compress(currentFile, format, quality);
  sizeLabel.textContent = `${(currentBlob.size / 1024).toFixed(1)} KB`;

  if (compressedBitmap) compressedBitmap.close();
  compressedBitmap = await createImageBitmap(currentBlob);

  render();
}

downloadBtn.addEventListener('click', () => {
  if (!currentBlob) return;
  const url = URL.createObjectURL(currentBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compressed.${formatSelect.value}`;
  a.click();
  // Revoke after the browser has had a frame to initiate the download
  requestAnimationFrame(() => URL.revokeObjectURL(url));
});
```

A few things worth calling out. The `qualitySlider.disabled = format === 'png'` line puts the PNG quality trap from section 5 directly in the UI — the slider greys out when the user picks PNG, which is more honest than leaving it active and pretending it does something. The `compressedBitmap.close()` call before creating a new one frees the previous decoded bitmap from GPU memory; skipping this leaks a new texture object every time the slider moves.

For format comparison — the question "does AVIF actually win for this texture?" — swap the `formatSelect` value and call `recompress()`. Same file, same pipeline, different encoder. For Three.js textures, AVIF at Q=60 often halves the JPEG at Q=80, but "often" is doing a lot of work in that sentence. This is exactly what the previewer is for: zoom to 4× on the roughness channel, drag the divider, and see whether the quantization artifacts are acceptable at the resolution your scene actually samples.

---

## 9. Responsiveness

The canvas split-view doesn't translate to small screens. A draggable divider at useful zoom on a 375px display is a bad experience — the image is too small, and touch events on the divider conflict with scroll.

Two ways to handle it:

**Option A — Stack vertically.** Below a breakpoint, swap the single clipped canvas for two separate full-width canvases stacked top-to-bottom, and hide the divider. The render function needs a flag to draw to two targets instead of one, but the encode pipeline doesn't change at all.

```css
@media (max-width: 640px) {
  .split-container { flex-direction: column; }
  .divider { display: none; }
}
```

**Option B — Gate the tool.** Show a message asking the user to open on a wider screen. This is defensible when the use case is explicitly a desktop workflow — pixel-level texture comparison for WebGL is not a phone task.

Option A is more work but serves more users. Option B is honest about scope. Pick based on your audience.

---

## 10. Accessibility

The split-view UI makes two assumptions: the user has a pointer device and can see the canvas. Worth addressing both before shipping.

**Keyboard access to the dropzone.**

A raw `<div>` with a `drop` listener is unreachable via keyboard. Wrap it with a visually hidden `<input type="file">` and a `<label>`:

```html
<label class="dropzone" for="file-input">
  Drop an image here, or click to browse
  <input id="file-input" type="file" accept="image/*" class="visually-hidden">
</label>
```

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

Wire the `change` event on the input to the same handler as `drop`. The quality slider and format select are native elements — they're keyboard-accessible by default. Add visible `<label>` elements if they're missing.

**Screen reader labels.**

The canvas is opaque to assistive technology. Give it a role and a description:

```html
<canvas role="img" aria-label="Split-view image compression preview"></canvas>
```

The file size readout updates on every encode. Wrap it in `aria-live` so screen readers announce changes without the user having to navigate to it:

```html
<span id="size-label" aria-live="polite"></span>
```

**Reduced motion.**

The divider drag is immediate — no animation to suppress there. But if you add transitions anywhere (a fade between quality levels, a slide-in on the download button), wrap them:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

---

## Wrap-Up

What you've built: a browser-native compression previewer that encodes images via libvips entirely in a Web Worker, compares original and compressed output at pixel level, and can target a file size without binary search. The whole thing runs locally.

Three things break it if you get them wrong:

1. **Worker isolation.** Move Vips to the main thread and you'll block paint for 200–400ms on init. It's not subtle.
2. **`image.delete()` after every encode.** WASM memory isn't garbage collected. Each encode allocates; each delete frees. Skip one and watch the DevTools heap climb after a few slider moves.
3. **`compressedBitmap.close()` before every re-render.** GPU texture memory leaks the same way. Close the old one before creating the new one.

Everything else — the size-targeting algorithm, the checkerboard, the divider drag — is plumbing around those three invariants.

The most interesting place to take this further is the AVIF quality curve. The two-phase targeting is a practical shortcut, not a rigorous solution. The quality-to-size relationship for AVIF varies more by image content than JPEG or WebP — there's room to build smarter heuristics based on image entropy, or to run a tighter binary search in the monotonic region (roughly Q=30–80) and only fall back to the step descent below that.

A working version of this tool is at [convertyard.com/compress-image](https://convertyard.com/compress-image) — Worker-owned Vips instance, `ArrayBuffer` transfers, two-phase size targeting, canvas split view, same architecture as described here.

---

*Garrick Dee Tan is the builder behind [ConvertYard](https://convertyard.com), a suite of local-first batch file tools. Everything runs in the browser via WebAssembly — files never leave your machine.*
