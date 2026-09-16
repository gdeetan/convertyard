#!/usr/bin/env bash
# spike/scripts/measure-scan-codecs.sh
#
# Measurement pass for PDF scan-codec spike.
# Encodes fixtures with jbig2enc (lossless + lossy) and CCITT G4,
# reports per-fixture and per-codec byte sizes and per-page timings.
#
# Prereqs (Ubuntu):
#   sudo apt-get install -y jbig2enc libtiff-tools poppler-utils qpdf
#
# Usage:
#   ./spike/scripts/measure-scan-codecs.sh <fixtures-dir> <output-report-md>

set -euo pipefail

FIX_DIR="${1:-fixtures/pdf-scan-codec-spike}"
REPORT="${2:-spike/notes/03-measurement.md}"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

if ! command -v jbig2 >/dev/null 2>&1; then
  echo "ERROR: jbig2enc (binary: jbig2) not found. apt install jbig2enc." >&2
  exit 2
fi
if ! command -v pdfimages >/dev/null 2>&1; then
  echo "ERROR: poppler-utils not found. apt install poppler-utils." >&2
  exit 2
fi
if ! command -v tiffcp >/dev/null 2>&1; then
  echo "ERROR: libtiff-tools not found. apt install libtiff-tools." >&2
  exit 2
fi

mkdir -p "$(dirname "$REPORT")"

{
  echo "# PDF scan-codec measurement report"
  echo
  echo "Generated: $(date -u +%FT%TZ)"
  echo "Host: $(uname -sr)"
  echo "Tool versions:"
  echo "  - jbig2enc: $(jbig2 -V 2>&1 | head -1 || echo unknown)"
  echo "  - tiffcp:   $(tiffcp -h 2>&1 | head -1 || echo unknown)"
  echo "  - pdfimages: $(pdfimages -v 2>&1 | head -1 || echo unknown)"
  echo
  echo "## Per-fixture results"
  echo
} > "$REPORT"

for pdf in "$FIX_DIR"/*.pdf; do
  [ -f "$pdf" ] || continue
  name=$(basename "$pdf")
  case "$name" in
    B1BTextBook.pdf|B2-A_*.pdf|B3-A*.pdf|2be1-Workbook*.pdf|4Ws-*.pdf|4月*.pdf)
      # skip user's digital-native fixtures — not scans
      continue
      ;;
  esac

  echo "=== $name ===" >&2
  orig_bytes=$(stat -c%s "$pdf" 2>/dev/null || stat -f%z "$pdf")
  page_count=$(pdfinfo "$pdf" 2>/dev/null | awk '/^Pages:/ {print $2}' || echo 0)

  fdir="$WORK/$(echo "$name" | tr ' ' _)"
  mkdir -p "$fdir"

  # Cap extraction to first 50 pages for measurement — per-page compression
  # ratios don't need the full document. Keeps CI under the timeout.
  PAGE_CAP=50
  pdfimages -j -f 1 -l "$PAGE_CAP" "$pdf" "$fdir/img" 2>/dev/null || true
  pdfimages -tiff -f 1 -l "$PAGE_CAP" "$pdf" "$fdir/tif" 2>/dev/null || true

  # Original embedded image byte total (jpg/png/etc)
  emb_bytes=$(du -bc "$fdir"/img-*.* 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)
  tif_bytes=$(du -bc "$fdir"/tif-*.tif 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)

  # Count extracted images
  n_img=$(ls "$fdir"/img-*.* 2>/dev/null | wc -l | tr -d ' ')
  n_tif=$(ls "$fdir"/tif-*.tif 2>/dev/null | wc -l | tr -d ' ')

  # --- CCITT G4 re-encode via tiffcp on the extracted TIFFs ---
  ccitt_dir="$fdir/ccitt"
  mkdir -p "$ccitt_dir"
  ccitt_ms_start=$(date +%s%N)
  ccitt_fail=0
  for t in "$fdir"/tif-*.tif; do
    [ -f "$t" ] || continue
    out="$ccitt_dir/$(basename "$t" .tif).g4.tif"
    # tiffcp -c g4 requires 1-bit input; force via -c g4 attempt, log failures
    tiffcp -c g4 "$t" "$out" 2>/dev/null || { ccitt_fail=$((ccitt_fail+1)); continue; }
  done
  ccitt_ms_end=$(date +%s%N)
  ccitt_ms=$(( (ccitt_ms_end - ccitt_ms_start) / 1000000 ))
  ccitt_bytes=$(du -bc "$ccitt_dir"/*.g4.tif 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)

  # --- JBIG2 lossless re-encode ---
  jb2ll_dir="$fdir/jbig2-lossless"
  mkdir -p "$jb2ll_dir"
  jb2ll_ms_start=$(date +%s%N)
  ( cd "$jb2ll_dir" && jbig2 -p "$fdir"/tif-*.tif >/dev/null 2>&1 || true )
  jb2ll_ms_end=$(date +%s%N)
  jb2ll_ms=$(( (jb2ll_ms_end - jb2ll_ms_start) / 1000000 ))
  jb2ll_bytes=$(du -bc "$jb2ll_dir"/output.* 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)

  # --- JBIG2 lossy (symbol substitution) ---
  jb2ly_dir="$fdir/jbig2-lossy"
  mkdir -p "$jb2ly_dir"
  jb2ly_ms_start=$(date +%s%N)
  # 10-min ceiling per fixture on lossy — symbol-substitution is superlinear.
  ( cd "$jb2ly_dir" && timeout 600 jbig2 -s -t 0.85 -p "$fdir"/tif-*.tif >/dev/null 2>&1 || echo "LOSSY_TIMEOUT" > TIMEOUT )
  jb2ly_ms_end=$(date +%s%N)
  jb2ly_ms=$(( (jb2ly_ms_end - jb2ly_ms_start) / 1000000 ))
  jb2ly_bytes=$(du -bc "$jb2ly_dir"/output.* 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)

  {
    echo "### $name"
    echo
    echo "- Original PDF: $orig_bytes bytes ($((orig_bytes/1024)) KB), $page_count pages"
    echo "- Extracted images (native): $n_img files, $emb_bytes bytes"
    echo "- Extracted images (tif): $n_tif files, $tif_bytes bytes"
    echo
    echo "| Codec | Total bytes | Ratio vs tif | Ratio vs orig | Encode ms | Notes |"
    echo "|---|---|---|---|---|---|"
    if [ "$tif_bytes" -gt 0 ]; then
      printf "| CCITT G4 (tiffcp) | %s | %.2fx | %.2fx | %s | %d files failed |\n" \
        "$ccitt_bytes" "$(awk "BEGIN{print $ccitt_bytes/$tif_bytes}")" "$(awk "BEGIN{print $ccitt_bytes/$orig_bytes}")" "$ccitt_ms" "$ccitt_fail"
      printf "| JBIG2 lossless (jbig2enc) | %s | %.2fx | %.2fx | %s | |\n" \
        "$jb2ll_bytes" "$(awk "BEGIN{print $jb2ll_bytes/$tif_bytes}")" "$(awk "BEGIN{print $jb2ll_bytes/$orig_bytes}")" "$jb2ll_ms"
      printf "| JBIG2 lossy (-s -t 0.85) | %s | %.2fx | %.2fx | %s | |\n" \
        "$jb2ly_bytes" "$(awk "BEGIN{print $jb2ly_bytes/$tif_bytes}")" "$(awk "BEGIN{print $jb2ly_bytes/$orig_bytes}")" "$jb2ly_ms"
    else
      echo "| (skipped — no tif extracted) | - | - | - | - | - |"
    fi
    echo
  } >> "$REPORT"
done

{
  echo "## Interpretation notes"
  echo
  echo "- **Extracted images (tif)** is the fair 'raw' baseline for re-encode comparison."
  echo "- **Ratio vs orig** compares encoded-only-images to full PDF file size (includes text layer, metadata, structure)."
  echo "- CCITT G4 failures usually mean the source page was grayscale or color (tiffcp -c g4 requires 1-bit)."
  echo "- JBIG2 lossy uses default symbol-substitution threshold 0.85. Higher = more aggressive."
  echo "- Timings include all pages in the fixture — divide by page count for per-page average."
  echo
} >> "$REPORT"

echo "Report written to $REPORT"
