declare module 'gifsicle-wasm-browser' {
  interface RunInput {
    file: ArrayBuffer | Uint8Array
    name: string
  }
  interface RunOutput {
    file: Uint8Array
    name: string
  }
  interface RunOptions {
    input: RunInput[]
    command: string[]
  }
  const gifsicle: {
    run(options: RunOptions): Promise<RunOutput[]>
  }
  export default gifsicle
}
