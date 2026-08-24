import { afterEach, describe, expect, it } from 'vitest'

import {
  __resetTranscriptionClientForTests,
  __setWorkerFactoryForTests,
  loadTranscriptionModel,
  transcribeAudio,
} from '@/lib/converters/transcription-client'

class MockWorker extends EventTarget {
  postMessageCount = 0

  postMessage(message: { type: string; quality?: string }) {
    this.postMessageCount += 1
    queueMicrotask(() => {
      if (message.type !== 'load') return
      this.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'error',
          error: {
            code: 'MODEL_SESSION_CREATE_FAILED',
            phase: 'load',
            rawMessage: 'mock load failure',
            message: 'mock load failure',
          },
        },
      }))
    })
  }
}

describe('transcription client retries after model load failure', () => {
  afterEach(() => {
    __resetTranscriptionClientForTests()
  })

  it('clears the cached loading promise after a failed load', async () => {
    let workerCount = 0
    let postMessageCount = 0
    __setWorkerFactoryForTests(() => {
      workerCount += 1
      const worker = new MockWorker()
      const originalPostMessage = worker.postMessage.bind(worker)
      worker.postMessage = (message) => {
        postMessageCount += 1
        originalPostMessage(message)
      }
      return worker as unknown as Worker
    })

    await expect(loadTranscriptionModel('balanced', () => {})).rejects.toMatchObject({
      code: 'MODEL_SESSION_CREATE_FAILED',
    })
    await expect(loadTranscriptionModel('balanced', () => {})).rejects.toMatchObject({
      code: 'MODEL_SESSION_CREATE_FAILED',
    })

    expect(workerCount).toBe(1)
    expect(postMessageCount).toBe(2)
  })
})

describe('transcribeAudio prompt forwarding', () => {
  afterEach(() => {
    __resetTranscriptionClientForTests()
  })

  it('includes prompt on the transcribe message when provided', async () => {
    const posted: unknown[] = []
    __setWorkerFactoryForTests(() => {
      const worker = new EventTarget() as EventTarget & { postMessage: (msg: unknown) => void }
      worker.postMessage = (msg: unknown) => {
        posted.push(msg)
        const id = (msg as { id?: string }).id
        queueMicrotask(() => {
          worker.dispatchEvent(new MessageEvent('message', {
            data: { type: 'transcribe-result', id, result: { text: 'ok' } },
          }))
        })
      }
      return worker as unknown as Worker
    })

    await transcribeAudio(new Float32Array([0]), 16000, 'en', false, undefined, undefined, 'ConvertYard.')
    expect(posted[0]).toMatchObject({
      type: 'transcribe',
      prompt: 'ConvertYard.',
      language: 'en',
      timestamps: false,
    })
  })

  it('omits prompt when undefined so captions calls stay unchanged', async () => {
    const posted: unknown[] = []
    __setWorkerFactoryForTests(() => {
      const worker = new EventTarget() as EventTarget & { postMessage: (msg: unknown) => void }
      worker.postMessage = (msg: unknown) => {
        posted.push(msg)
        const id = (msg as { id?: string }).id
        queueMicrotask(() => {
          worker.dispatchEvent(new MessageEvent('message', {
            data: { type: 'transcribe-result', id, result: { text: 'ok' } },
          }))
        })
      }
      return worker as unknown as Worker
    })

    await transcribeAudio(new Float32Array([0]), 16000, null, 'word')
    expect(posted[0]).toMatchObject({ type: 'transcribe', timestamps: 'word' })
    expect((posted[0] as { prompt?: string }).prompt).toBeUndefined()
  })
})
