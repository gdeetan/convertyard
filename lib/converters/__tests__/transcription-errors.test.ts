import { describe, expect, it } from 'vitest'

import {
  classifyTranscriptionError,
  formatTranscriptionError,
  toTranscriptionUserMessage,
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

  it('never stringifies a structured error as [object Object]', () => {
    const shaped = classifyTranscriptionError(
      "Can't create a session. ERROR_CODE: 1, ERROR_MESSAGE: qdq_actions.cc:137 TransposeDQWeightsForMatMulNBits Missing required scale"
    )
    expect(toTranscriptionUserMessage(shaped)).not.toContain('[object Object]')
    expect(toTranscriptionUserMessage(shaped)).toContain('failed to initialize')
    expect(toTranscriptionUserMessage({ weird: true })).not.toBe('[object Object]')
  })

  it('maps ffmpeg stream failures to video extraction errors', () => {
    const error = classifyTranscriptionError('ffmpeg: Output file #0 does not contain any stream')

    expect(error.code).toBe('VIDEO_AUDIO_EXTRACT_FAILED')
    expect(error.phase).toBe('extract')
  })

  it('maps missing Whisper cross-attentions to a word-timestamp failure, not UNKNOWN', () => {
    const error = classifyTranscriptionError(
      'Model outputs must contain cross attentions to extract timestamps. This is most likely because the model was not exported with `output_attentions=True`.',
    )

    expect(error.code).toBe('TRANSCRIBE_FAILED')
    expect(error.phase).toBe('transcribe')
    expect(formatTranscriptionError(error)).not.toContain('unexpectedly')
  })

  it('maps Int16Array heap-view failures to audio extract errors', () => {
    const error = classifyTranscriptionError(
      new RangeError('byte length of Int16Array should be a multiple of 2'),
    )

    expect(error.code).toBe('VIDEO_AUDIO_EXTRACT_FAILED')
    expect(toTranscriptionUserMessage(error)).toContain('audio track could not be extracted')
  })
})
