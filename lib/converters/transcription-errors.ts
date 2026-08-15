export type TranscriptionErrorCode =
  | 'MODEL_SESSION_CREATE_FAILED'
  | 'MODEL_UNSUPPORTED_QUANTIZATION'
  | 'MODEL_DOWNLOAD_FAILED'
  | 'WORKER_INIT_FAILED'
  | 'VIDEO_AUDIO_EXTRACT_FAILED'
  | 'AUDIO_DECODE_FAILED'
  | 'TRANSCRIBE_FAILED'
  | 'UNKNOWN'

export type TranscriptionErrorPhase = 'load' | 'extract' | 'decode' | 'transcribe' | 'worker' | 'unknown'

export interface TranscriptionLoadAttempt {
  modelId: string
  dtype: string
  quality?: string
  error?: string
}

export interface TranscriptionErrorShape {
  code: TranscriptionErrorCode
  message: string
  phase: TranscriptionErrorPhase
  rawMessage: string
  modelId?: string
  dtype?: string
  attempts?: TranscriptionLoadAttempt[]
}

export function isQuantizationErrorMessage(message: string): boolean {
  return /TransposeDQWeightsForMatMulNBits|Missing required scale|MatMulNBits/i.test(message)
}

export function classifyTranscriptionError(
  raw: unknown,
  overrides: Partial<Omit<TranscriptionErrorShape, 'message' | 'rawMessage'>> = {}
): TranscriptionErrorShape {
  const rawMessage =
    raw instanceof Error
      ? raw.message
      : typeof raw === 'string'
        ? raw
        : typeof raw === 'object' && raw !== null && 'message' in raw && typeof (raw as { message?: unknown }).message === 'string'
          ? (raw as { message: string }).message
          : String(raw)

  let code: TranscriptionErrorCode = 'UNKNOWN'
  let phase: TranscriptionErrorPhase = 'unknown'

  if (isQuantizationErrorMessage(rawMessage)) {
    code = 'MODEL_UNSUPPORTED_QUANTIZATION'
    phase = 'load'
  } else if (/Can't create a session|create a session|InferenceSession|qdq_actions/i.test(rawMessage)) {
    code = 'MODEL_SESSION_CREATE_FAILED'
    phase = 'load'
  } else if (/fetch|network|download|Failed to fetch|Load failed|HTTP/i.test(rawMessage)) {
    code = 'MODEL_DOWNLOAD_FAILED'
    phase = 'load'
  } else if (/decodeAudioData|EncodingError|Unable to decode|decode/i.test(rawMessage)) {
    code = 'AUDIO_DECODE_FAILED'
    phase = 'decode'
  } else if (/ffmpeg|Output file #0 does not contain any stream|no audio|stream/i.test(rawMessage)) {
    code = 'VIDEO_AUDIO_EXTRACT_FAILED'
    phase = 'extract'
  } else if (/Worker error|worker/i.test(rawMessage)) {
    code = 'WORKER_INIT_FAILED'
    phase = 'worker'
  } else if (/transcrib/i.test(rawMessage)) {
    code = 'TRANSCRIBE_FAILED'
    phase = 'transcribe'
  }

  const error: TranscriptionErrorShape = {
    code,
    phase,
    rawMessage,
    message: rawMessage,
    ...overrides,
  }

  if (overrides.code && !overrides.phase) {
    error.phase =
      overrides.code === 'VIDEO_AUDIO_EXTRACT_FAILED' ? 'extract'
      : overrides.code === 'AUDIO_DECODE_FAILED' ? 'decode'
      : overrides.code === 'TRANSCRIBE_FAILED' ? 'transcribe'
      : overrides.code === 'WORKER_INIT_FAILED' ? 'worker'
      : 'load'
  }

  return error
}

export function isTranscriptionErrorShape(err: unknown): err is TranscriptionErrorShape {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    typeof (err as { message: unknown }).message === 'string'
  )
}

/** Never return "[object Object]" — caption UI and the transcription page share this. */
export function toTranscriptionUserMessage(err: unknown): string {
  const shaped = isTranscriptionErrorShape(err) ? err : classifyTranscriptionError(err)
  return formatTranscriptionError(shaped)
}

export function formatTranscriptionError(error: TranscriptionErrorShape): string {
  switch (error.code) {
    case 'MODEL_UNSUPPORTED_QUANTIZATION':
    case 'MODEL_SESSION_CREATE_FAILED':
      return 'The selected Whisper model failed to initialize in this browser. The tool tried fallback variants but none loaded successfully.'
    case 'MODEL_DOWNLOAD_FAILED':
      return 'The Whisper model could not be downloaded. Check your connection and try again.'
    case 'VIDEO_AUDIO_EXTRACT_FAILED':
      return 'The video audio track could not be extracted. Try a different file or convert the audio track first.'
    case 'AUDIO_DECODE_FAILED':
      return 'The audio file could not be decoded in this browser. Try WAV, MP3, or M4A.'
    case 'WORKER_INIT_FAILED':
      return 'The transcription worker failed to start. Refresh the page and try again.'
    case 'TRANSCRIBE_FAILED':
      return 'Transcription started but did not finish successfully.'
    default:
      return 'Transcription failed unexpectedly. Try again with a smaller file or a different format.'
  }
}
