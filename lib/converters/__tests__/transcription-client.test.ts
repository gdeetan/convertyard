import { afterEach, describe, expect, it } from 'vitest'

import {
  __resetTranscriptionClientForTests,
  __setWorkerFactoryForTests,
  loadTranscriptionModel,
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
