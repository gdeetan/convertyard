import { DevToolsLive } from './devtools-live'

export function DevToolsProof() {
  return (
    <section aria-labelledby="devtools-heading" className="py-10 sm:py-16">
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
            Still not convinced?
          </p>
          <h2
            id="devtools-heading"
            className="text-2xl font-bold tracking-tight text-fg sm:text-3xl"
          >
            Check it yourself in 15 seconds
          </h2>
        </div>

        <DevToolsLive />
      </div>
    </section>
  )
}
