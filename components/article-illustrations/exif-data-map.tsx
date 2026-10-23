export function ExifDataMapIllustration() {
  return (
    <figure className="my-8">
      <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Map panel */}
          <div className="md:col-span-3 relative aspect-[4/3] md:aspect-auto bg-[#e8eef3] overflow-hidden">
            <svg
              viewBox="0 0 400 300"
              className="absolute inset-0 w-full h-full"
              aria-hidden="true"
            >
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#cfd8e3" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="400" height="300" fill="#e8eef3" />
              <rect width="400" height="300" fill="url(#grid)" />

              {/* Parks / blocks */}
              <path d="M20 40 L120 40 L120 110 L20 110 Z" fill="#d3e4cf" />
              <path d="M250 20 L380 20 L380 90 L250 90 Z" fill="#d3e4cf" />
              <path d="M40 200 L160 200 L160 280 L40 280 Z" fill="#dde6ef" />
              <path d="M260 190 L380 190 L380 280 L260 280 Z" fill="#dde6ef" />

              {/* Roads */}
              <path d="M0 150 L400 150" stroke="#ffffff" strokeWidth="10" />
              <path d="M0 150 L400 150" stroke="#f0c419" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M200 0 L200 300" stroke="#ffffff" strokeWidth="8" />
              <path d="M80 0 L80 300" stroke="#ffffff" strokeWidth="5" />
              <path d="M320 0 L320 300" stroke="#ffffff" strokeWidth="5" />
              <path d="M0 230 L400 230" stroke="#ffffff" strokeWidth="5" />

              {/* Pin shadow */}
              <ellipse cx="200" cy="162" rx="12" ry="3" fill="#000" opacity="0.25" />

              {/* Pulse */}
              <circle cx="200" cy="150" r="22" fill="#dc2626" opacity="0.15">
                <animate attributeName="r" from="12" to="30" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Pin */}
              <path
                d="M200 120 C188 120 180 128 180 140 C180 155 200 162 200 162 C200 162 220 155 220 140 C220 128 212 120 200 120 Z"
                fill="#dc2626"
                stroke="#991b1b"
                strokeWidth="1.5"
              />
              <circle cx="200" cy="138" r="5" fill="#fff" />

              {/* Coord callout */}
              <g transform="translate(214,98)">
                <rect
                  x="0"
                  y="0"
                  width="156"
                  height="36"
                  rx="4"
                  fill="#ffffff"
                  stroke="#dc2626"
                  strokeWidth="1.5"
                />
                <text x="8" y="15" fontFamily="ui-monospace, monospace" fontSize="10" fill="#991b1b" fontWeight="700">
                  37.7749° N, 122.4194° W
                </text>
                <text x="8" y="28" fontFamily="ui-monospace, monospace" fontSize="9" fill="#6b7280">
                  precise to ~3 m
                </text>
              </g>
            </svg>

            <div className="absolute left-3 bottom-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
              Embedded in IMG_4218.JPG
            </div>
          </div>

          {/* Fields panel */}
          <div className="md:col-span-2 bg-white divide-y divide-border">
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-fg-subtle">Timestamp</p>
              <p className="font-mono text-[12px] text-fg mt-0.5">2026-03-14 · 14:31:08 PDT</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-fg-subtle">Camera</p>
              <p className="font-mono text-[12px] text-fg mt-0.5">Apple iPhone 15 Pro</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-fg-subtle">Exposure</p>
              <p className="font-mono text-[12px] text-fg mt-0.5">ƒ/1.78 · 1/120s · ISO 64</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-fg-subtle">Lens</p>
              <p className="font-mono text-[12px] text-fg mt-0.5">24 mm · 1.0× main</p>
            </div>
            <div className="px-4 py-3 bg-red-50">
              <p className="font-mono text-[10px] uppercase tracking-wide text-red-600 font-semibold">GPS Location</p>
              <p className="font-mono text-[12px] text-red-700 mt-0.5 font-semibold">37.7749° N, 122.4194° W</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-bg px-4 py-2">
          <p className="font-mono text-[10px] text-fg-subtle">
            Every field above travels with the JPEG — share the file, share the data.
          </p>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-fg-subtle">
        A single JPEG from a modern smartphone — the GPS field maps straight to the building where it was taken.
      </figcaption>
    </figure>
  )
}
