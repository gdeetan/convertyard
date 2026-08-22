#!/usr/bin/env bash
# Quantize Organika/sdxl-detector to int8 and prepare an R2 upload.
#
# Prereqs (one-time):
#   pip install --upgrade optimum[exporters] onnx onnxruntime transformers
#   wrangler login    # if you'll use wrangler to upload
#
# What this does:
#   1. Downloads Organika/sdxl-detector from HuggingFace
#   2. Exports to ONNX (fp32) then quantizes to int8 (~90 MB)
#   3. Writes into ./sdxl-detector-r2/ ready for upload
#
# After running this, upload the folder to your R2 bucket:
#   wrangler r2 object put YOUR_BUCKET/models/sdxl-detector/config.json               --file sdxl-detector-r2/config.json
#   wrangler r2 object put YOUR_BUCKET/models/sdxl-detector/preprocessor_config.json  --file sdxl-detector-r2/preprocessor_config.json
#   wrangler r2 object put YOUR_BUCKET/models/sdxl-detector/onnx/model_quantized.onnx --file sdxl-detector-r2/onnx/model_quantized.onnx
#
# Then in lib/converters/ai-detector-worker.ts, replace:
#   const MODEL_ID = 'Organika/sdxl-detector'
# with:
#   const MODEL_ID = 'models/sdxl-detector'
# and set env.remoteHost = 'https://<your-r2-public-host>/' in getClassifier().

set -euo pipefail

OUT_DIR="sdxl-detector-r2"
mkdir -p "$OUT_DIR/onnx"

echo "==> Exporting Organika/sdxl-detector to ONNX (fp32)…"
optimum-cli export onnx \
  --model Organika/sdxl-detector \
  --task image-classification \
  "$OUT_DIR"

echo "==> Quantizing to int8…"
python - <<'PY'
from pathlib import Path
from onnxruntime.quantization import quantize_dynamic, QuantType

src = Path("sdxl-detector-r2/model.onnx")
dst = Path("sdxl-detector-r2/onnx/model_quantized.onnx")
dst.parent.mkdir(parents=True, exist_ok=True)
quantize_dynamic(src, dst, weight_type=QuantType.QInt8)
print(f"Wrote {dst} ({dst.stat().st_size / (1024*1024):.1f} MB)")
PY

# Move the fp32 as well so we have both variants
mv "$OUT_DIR/model.onnx" "$OUT_DIR/onnx/model.onnx"

echo
echo "==> Done. Files ready in $OUT_DIR/:"
ls -lh "$OUT_DIR" "$OUT_DIR/onnx"
echo
echo "Next: upload to R2 (see comments at top of this script)."
