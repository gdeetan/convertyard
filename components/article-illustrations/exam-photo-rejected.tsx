export function ExamPhotoRejectedIllustration() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Portal header bar */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[11px] text-[#5f6368] ml-2">Upload Photograph — Step 2 of 4</span>
        <div className="ml-auto font-mono text-[10px] text-[#5f6368]">● ● ○ ○</div>
      </div>

      {/* Upload area */}
      <div className="p-4 space-y-3">

        {/* Dashed upload box with photo placeholder */}
        <div className="rounded-lg border-2 border-dashed border-red-400 bg-red-50 flex flex-col items-center justify-center gap-2 py-4 px-3">
          {/* Photo placeholder */}
          <div className="w-16 h-20 rounded bg-[#d1d5db] flex items-center justify-center relative">
            {/* Simple person silhouette suggestion */}
            <div className="flex flex-col items-center gap-0.5 opacity-40">
              <div className="w-5 h-5 rounded-full bg-[#6b7280]" />
              <div className="w-8 h-7 rounded-t-full bg-[#6b7280]" />
            </div>
            {/* Red badge */}
            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-bold" style={{ fontSize: '9px' }}>✕</span>
            </div>
          </div>
          <span className="font-mono text-[11px] text-red-600">candidate_photo.jpg</span>
          <span className="font-mono text-[10px] text-red-400">2.4 MB · JPEG</span>
        </div>

        {/* Error banner */}
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 flex items-start gap-2">
          <span className="text-red-600 font-bold font-mono text-[11px] mt-px">✗</span>
          <div>
            <p className="font-sans text-xs font-semibold text-red-700">Upload failed — File size exceeds limit (max 50 KB)</p>
            <p className="font-mono text-[10px] text-red-500 mt-0.5">Your file: 2.4 MB · Needs to be under 50 KB</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button className="flex-1 rounded-md bg-[#c2410c] px-3 py-1.5 font-sans text-xs font-semibold text-white text-center">
            Compress Photo
          </button>
          <button className="flex-1 rounded-md border border-border bg-white px-3 py-1.5 font-sans text-xs font-semibold text-fg text-center">
            Re-upload
          </button>
        </div>

      </div>
    </div>
  )
}
