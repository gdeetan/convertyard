export function ExtractAudioIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">
          MP4 container — pull the audio track
        </span>
      </div>

      <div className="flex items-center gap-0 p-4 bg-bg">
        <div className="flex-1 rounded-lg border-2 border-[#d1d5db] bg-bg-elevated overflow-hidden shadow-sm">
          <div className="bg-[#e5e7eb] flex flex-col items-center justify-center pt-4 pb-2 px-3 gap-1">
            <div className="w-10 h-12 bg-[#9ca3af] rounded-sm relative flex items-center justify-center">
              <div
                className="absolute top-0 right-0 w-3 h-3 bg-[#6b7280]"
                style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}
              />
              <span className="font-mono text-white text-[8px] font-bold mt-2">MP4</span>
            </div>
            <p className="font-mono text-[11px] text-fg font-semibold">lecture.mp4</p>
            <p className="font-mono text-[10px] text-fg-muted">186 MB</p>
          </div>
          <div className="px-2.5 py-2 space-y-1 bg-white border-t border-border">
            <p className="font-mono text-[9px] text-fg-subtle">video · H.264</p>
            <p className="font-mono text-[9px] text-fg">audio · AAC 192 kbps</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-3 gap-1">
          <span className="font-mono text-[10px] text-fg-muted">Extract</span>
          <span className="text-fg-subtle text-lg leading-none">→</span>
        </div>

        <div className="flex-1 rounded-lg border-2 border-green-200 bg-green-50 overflow-hidden shadow-sm">
          <div className="bg-green-100 flex flex-col items-center justify-center pt-4 pb-2 px-3 gap-1">
            <div className="w-10 h-12 bg-green-400 rounded-sm relative flex items-center justify-center">
              <div
                className="absolute top-0 right-0 w-3 h-3 bg-green-500"
                style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}
              />
              <span className="font-mono text-white text-[8px] font-bold mt-2">MP3</span>
            </div>
            <p className="font-mono text-[11px] text-fg font-semibold">lecture.mp3</p>
            <p className="font-mono text-[10px] text-fg-muted">4.8 MB</p>
          </div>
          <div className="px-2.5 py-2 bg-green-50 border-t border-green-200">
            <p className="font-sans text-[10px] font-semibold text-green-700">Audio only</p>
            <p className="font-mono text-[9px] text-green-600">video track dropped</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1.5 flex items-center justify-center gap-4">
        <span className="font-mono text-[10px] text-[#5f6368]">MP3 / AAC / WAV / FLAC</span>
        <span className="font-mono text-[10px] text-[#9ca3af]">·</span>
        <span className="font-mono text-[10px] text-[#5f6368]">Copy AAC for no quality loss</span>
      </div>
    </div>
  )
}
