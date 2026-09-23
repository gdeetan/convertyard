'use client';

interface UnachievableTargetCardProps {
  bestBytes: number;
  targetBytes: number;
  onKeep: () => void;
  onRasterize: () => void;
  busy?: boolean;
  progress?: number | null;
  error?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
}

export function UnachievableTargetCard({
  bestBytes,
  targetBytes,
  onKeep,
  onRasterize,
  busy = false,
  progress = null,
  error = null,
}: UnachievableTargetCardProps) {
  const best = formatBytes(bestBytes);
  const target = formatBytes(targetBytes);
  const rasterizeLabel = busy
    ? progress != null
      ? `Rasterizing… ${Math.round(progress)}%`
      : 'Rasterizing…'
    : `Rasterize to reach ${target}`;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 my-4">
      <p className="text-sm text-amber-900 font-medium">
        Reach {target} by rasterizing — text becomes an image.
      </p>
      <p className="text-sm text-amber-800 mt-1">
        Keeping text searchable stops at {best}. Rasterizing flattens each page
        to a picture so the file can shrink further.
      </p>
      <div className="mt-3 flex gap-2 items-center">
        <button
          type="button"
          onClick={onRasterize}
          disabled={busy}
          aria-busy={busy}
          className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-70 disabled:cursor-progress inline-flex items-center gap-2"
        >
          {busy && (
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin"
            />
          )}
          {rasterizeLabel}
        </button>
        <button
          type="button"
          onClick={onKeep}
          disabled={busy}
          className="px-3 py-1.5 text-sm rounded border border-amber-400 bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          Keep as {best}
        </button>
      </div>
      {busy && (
        <p className="text-xs text-amber-800 mt-2">
          Rasterizing a large PDF can take a minute. Keep this tab in the foreground.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
