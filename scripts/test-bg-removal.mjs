/**
 * Node.js smoke test for MODNet background removal pipeline.
 * Tests every step from model load → tensor shapes → mask creation.
 * OffscreenCanvas composite is skipped (browser-only) but all ML steps are validated.
 *
 * Run: node scripts/test-bg-removal.mjs
 */

// Force WASM backend — native onnxruntime-node binaries not present for x64
import { env } from '@huggingface/transformers'
env.backends.onnx.wasm.proxy = false

import { AutoModelForImageSegmentation, AutoImageProcessor, RawImage } from '@huggingface/transformers'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(__dirname, 'test-output')

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

// Pick a real photo from test-images/
const TEST_IMAGE = join(ROOT, 'test-images', 'DSC00287.jpg')

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`  ✓ ${message}`)
}

async function run() {
  console.log('\n── Step 1: Load model ──────────────────────────────────────────')
  const processor = await AutoImageProcessor.from_pretrained('Xenova/modnet')
  console.log('  ✓ Processor loaded')

  const model = await AutoModelForImageSegmentation.from_pretrained('Xenova/modnet', {
    dtype: 'q8',
  })
  console.log('  ✓ Model loaded')

  console.log('\n── Step 2: Load test image ─────────────────────────────────────')
  const imgBuffer = readFileSync(TEST_IMAGE)
  const blob = new Blob([imgBuffer], { type: 'image/jpeg' })
  const image = await RawImage.fromBlob(blob)
  console.log(`  ✓ Image loaded: ${image.width}×${image.height}, ${image.channels}ch`)
  assert(image.width > 0, 'image has valid width')
  assert(image.height > 0, 'image has valid height')

  console.log('\n── Step 3: Preprocess ──────────────────────────────────────────')
  const { pixel_values } = await processor(image)
  console.log(`  ✓ pixel_values dims: [${pixel_values.dims.join(', ')}]`)
  assert(pixel_values.dims.length === 4, 'pixel_values is 4D [B, C, H, W]')

  console.log('\n── Step 4: Inference ───────────────────────────────────────────')
  const modelOutputs = await model({ input: pixel_values })
  console.log(`  ✓ Output keys: ${Object.keys(modelOutputs).join(', ')}`)
  assert('output' in modelOutputs, "model output has 'output' key")

  console.log('\n── Step 5: Inspect mask tensor ─────────────────────────────────')
  const rawOutput = modelOutputs.output
  console.log(`  ✓ rawOutput is array: ${Array.isArray(rawOutput)}`)

  const maskTensor = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput
  console.log(`  ✓ maskTensor dims: [${maskTensor.dims.join(', ')}]`)

  // Apply squeeze if 4D [1, 1, H, W] → [1, H, W]
  const squeezed = maskTensor.dims.length === 4 ? maskTensor.squeeze(0) : maskTensor
  console.log(`  ✓ squeezed dims: [${squeezed.dims.join(', ')}]`)
  assert(squeezed.dims.length === 3, 'squeezed mask is 3D')

  console.log('\n── Step 6: Scale to 0–255 and convert ─────────────────────────')
  const tensor = squeezed.mul(255).to('uint8')
  console.log(`  ✓ tensor dims after mul+cast: [${tensor.dims.join(', ')}]`)
  assert(tensor.dims.length === 3, 'final tensor is 3D before RawImage')

  console.log('\n── Step 7: RawImage.fromTensor ─────────────────────────────────')
  const mask = await RawImage.fromTensor(tensor)
  console.log(`  ✓ Mask: ${mask.width}×${mask.height}, ${mask.channels}ch`)
  assert(mask.width > 0, 'mask has valid width')
  assert(mask.height > 0, 'mask has valid height')
  assert(mask.channels === 1, 'mask is single-channel (greyscale alpha)')

  console.log('\n── Step 8: Resize mask to original image dimensions ────────────')
  const resizedMask = await mask.resize(image.width, image.height)
  console.log(`  ✓ Resized mask: ${resizedMask.width}×${resizedMask.height}`)
  assert(resizedMask.width === image.width, 'mask width matches image')
  assert(resizedMask.height === image.height, 'mask height matches image')

  console.log('\n── Step 9: Inspect mask values ─────────────────────────────────')
  const values = Array.from(resizedMask.data)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const nonZero = values.filter(v => v > 0).length
  const nonMax = values.filter(v => v < 255).length
  console.log(`  ✓ Mask value range: ${min}–${max}`)
  console.log(`  ✓ Non-zero pixels: ${nonZero}/${values.length} (${(nonZero/values.length*100).toFixed(1)}%)`)
  console.log(`  ✓ Non-max pixels (soft edges): ${nonMax}`)
  assert(min >= 0 && max <= 255, 'mask values in valid 0–255 range')
  assert(nonZero > 0, 'mask has foreground pixels (not all black)')
  assert(max === 255, 'mask has full-opacity foreground pixels')

  // Save the raw mask as PNG for visual inspection
  const maskOut = join(OUT_DIR, 'modnet-mask.png')
  // Convert single-channel mask to a viewable grayscale PNG by writing raw data
  // We write as a PGM header (viewable in Preview/most image viewers)
  const pgmHeader = `P5\n${resizedMask.width} ${resizedMask.height}\n255\n`
  const pgmData = Buffer.concat([
    Buffer.from(pgmHeader, 'ascii'),
    Buffer.from(resizedMask.data.buffer)
  ])
  writeFileSync(maskOut.replace('.png', '.pgm'), pgmData)
  console.log(`\n  ✓ Mask saved to: ${maskOut.replace('.png', '.pgm')} (open in Preview to inspect)`)

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  ALL TESTS PASSED — safe to deploy')
  console.log('══════════════════════════════════════════════════════════════\n')
}

run().catch((err) => {
  console.error('\n══════════════════════════════════════════════════════════════')
  console.error('  TEST FAILED:', err.message)
  console.error('══════════════════════════════════════════════════════════════\n')
  process.exit(1)
})
