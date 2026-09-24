declare module 'gifsicle-wasm-browser' {
  interface RunInput {
    file: ArrayBuffer | Uint8Array
    name: string
  }
  interface RunOptions {
    input: RunInput[]
    command: string[]
  }
  const gifsicle: {
    run(options: RunOptions): Promise<File[]>
  }
  export default gifsicle
}
