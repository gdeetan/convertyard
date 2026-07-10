import { describe, expect, it } from 'vitest'

import {
  classifyTranscriptionError,
  formatTranscriptionError,
} from '@/lib/converters/transcription-errors'

describe('transcription error classification', () => {
  it('maps the ONNX MatMulNBits failure to quantization incompatibility', () => {
    const error = classifyTranscriptionError(
      "Can't create a session. ERROR_CODE: 1, ERROR_MESSAGE: qdq_actions.cc:137 TransposeDQWeightsForMatMulNBits Missing required scale"
    )

    expect(error.code).toBe('MODEL_UNSUPPORTED_QUANTIZATION')
    expect(error.phase).toBe('load')
    expect(formatTranscriptionError(error)).toContain('failed to initialize')
  })

  it('maps ffmpeg stream failures to video extraction errors', () => {
    const error = classifyTranscriptionError('ffmpeg: Output file #0 does not contain any stream')

    expect(error.code).toBe('VIDEO_AUDIO_EXTRACT_FAILED')
    expect(error.phase).toBe('extract')
  })
})
