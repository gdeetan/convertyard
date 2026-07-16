# Receipt OCR Fixtures

Public sample receipts from the ReceiptSense/CORU dataset repository.

Source repository: https://github.com/Update-For-Integrated-Business-AI/CORU
Dataset page: https://huggingface.co/datasets/abdoelsayed/CORU
License noted by upstream: MIT

These five files are the public README sample images from `Update-For-Integrated-Business-AI/CORU`. The images include visual annotation overlays and some Arabic text. The paired `.txt` files are best-effort transcriptions of visible receipt text and key fields, intended as starter OCR fixtures rather than authoritative full dataset labels.

`manifest.json` marks mixed Arabic/English fixtures as stress tests. The default benchmark suite excludes those because the receipt-to-text tool is currently forced to English AI. Run `node scripts/benchmark-receipt-ocr.mjs --all` to include every fixture.

Files:

- `coru-sample-01.jpg` from `images/0cf392e3-e6bf-4bd7-85d5-7f91c73cdcaf.jpg`
- `coru-sample-02.jpg` from `images/0dccefa6-6928-499e-8aae-15c04d18cc94.jpg`
- `coru-sample-03.jpg` from `images/0dd4ada2-681e-42e7-b398-e093bc8b81c3.jpg`
- `coru-sample-04.jpg` from `images/0ef51dc7-4a0a-47e6-bc59-41f609d1c98d.jpg`
- `coru-sample-05.jpg` from `images/0f369dc1-1c5b-41b1-97bc-c9b94d53cd40.jpg`

Local user-provided fixtures:

- `user-sample-01.jpg` from `/Users/garrickdeetan/Downloads/738712373_28548838258038066_7272044848625434737_n.jpg`
- `user-sample-02.jpeg` from `/Users/garrickdeetan/Downloads/receipt 1.jpeg`
