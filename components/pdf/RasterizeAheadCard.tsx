'use client';

interface RasterizeAheadCardProps {
  fileCount: number;
  targetBytes: number;
  largestInputBytes: number;
  onRasterize: () => void;
  onRaiseTarget: () => void;
  suggestedTargetKB: number;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
}

/**
 * Shown before the user clicks Compress, when the target size is too small
 * for the keep-text ladder to reach on any of the selected files. Replaces
 * the primary Convert button with an explicit Rasterize action so the user
 * chooses the lossy path deliberately.
 */
export function RasterizeAheadCard({
  fileCount,
  targetBytes,
  largestInputBytes,
  onRasterize,
  onRaiseTarget,
  suggestedTargetKB,
}: RasterizeAheadCardProps) {
  const target = formatBytes(targetBytes);
  const input = formatBytes(largestInputBytes);
  const suggested = suggestedTargetKB >= 1024
    ? `${(suggestedTargetKB / 1024).toFixed(1)} MB`
    : `${suggestedTargetKB} KB`;
  const noun = fileCount === 1 ? 'this file' : 'these files';
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <p className="text-sm text-amber-900 font-medium dark:text-amber-100">
        Target {target} is too small to keep text searchable in {noun} ({input}).
      </p>
      <p className="text-sm text-amber-800 mt-1 dark:text-amber-200">
        Rasterizing flattens each page to an image so the file can shrink further.
        You&apos;ll lose: search, copy/paste, clickable links, form fields,
        screen-reader access, and crisp zoom-in.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={onRasterize}
          className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 font-semibold"
        >
          Rasterize {fileCount} file{fileCount === 1 ? '' : 's'}
        </button>
        <button
          type="button"
          onClick={onRaiseTarget}
          className="px-3 py-1.5 text-sm rounded border border-amber-400 bg-white text-amber-900 hover:bg-amber-100 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900"
        >
          Raise target to {suggested}
        </button>
      </div>
    </div>
  );
}
