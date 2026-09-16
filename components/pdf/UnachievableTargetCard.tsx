'use client';

interface UnachievableTargetCardProps {
  bestBytes: number;
  targetBytes: number;
  onKeep: () => void;
  onRasterize: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
}

export function UnachievableTargetCard({ bestBytes, targetBytes, onKeep, onRasterize }: UnachievableTargetCardProps) {
  const best = formatBytes(bestBytes);
  const target = formatBytes(targetBytes);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 my-4">
      <p className="text-sm text-amber-900 font-medium">
        Best possible: {best}. Target: {target} not met without rasterizing.
      </p>
      <p className="text-sm text-amber-800 mt-1">
        Rasterizing breaks searchable text — the PDF becomes a picture.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onKeep}
          className="px-3 py-1.5 text-sm rounded border border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
        >
          Keep as {best}
        </button>
        <button
          type="button"
          onClick={onRasterize}
          className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700"
        >
          Rasterize anyway
        </button>
      </div>
    </div>
  );
}
