import { PDFDocument, PDFDict, PDFName, PDFRawStream, PDFRef } from 'pdf-lib';

/**
 * SHA-1 of the given bytes as a lowercase hex string. Uses WebCrypto when
 * available (browser + Vitest jsdom), else falls back to Node's crypto.
 */
async function sha1Hex(bytes: Uint8Array): Promise<string> {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const nodeCrypto = await import('crypto');
  return nodeCrypto.createHash('sha1').update(Buffer.from(bytes)).digest('hex');
}

/**
 * Serialize a PDFDict to a canonical string for byte-identical comparison.
 * We can't rely on reference equality — dicts are cloned across contexts.
 */
function serializeDict(dict: PDFDict): string {
  return dict.toString();
}

export interface DedupeResult {
  collapsed: number;
}

/**
 * Detect image XObjects with byte-identical streams AND byte-identical dicts,
 * collapse duplicates onto the first-seen ref, and delete the redundant
 * indirect objects. Rewrites page-level Resources.XObject entries that
 * pointed at collapsed refs.
 */
export async function dedupeImageXObjects(doc: PDFDocument): Promise<DedupeResult> {
  const context = doc.context;

  // Step 1: hash every image XObject by (sha1(streamBytes) + serializedDict).
  const firstRefByKey = new Map<string, PDFRef>();
  const collapsedToPrimary = new Map<string, string>(); // ref.toString() -> primary ref.toString()
  const refByString = new Map<string, PDFRef>();

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const subtype = obj.dict.get(PDFName.of('Subtype'));
    if (subtype?.toString() !== '/Image') continue;

    let sha: string;
    try {
      sha = await sha1Hex(obj.contents);
    } catch {
      continue;
    }
    const key = `${sha}::${serializeDict(obj.dict)}`;
    const first = firstRefByKey.get(key);
    if (!first) {
      firstRefByKey.set(key, ref);
      refByString.set(ref.toString(), ref);
    } else {
      collapsedToPrimary.set(ref.toString(), first.toString());
      refByString.set(first.toString(), first);
    }
  }

  if (collapsedToPrimary.size === 0) return { collapsed: 0 };

  // Step 2: rewrite every page-level Resources.XObject entry that references
  // a collapsed ref to point at its primary.
  const pages = doc.getPages();
  for (const page of pages) {
    const resources = page.node.get(PDFName.of('Resources'));
    if (!(resources instanceof PDFDict)) continue;
    const xo = resources.get(PDFName.of('XObject'));
    if (!(xo instanceof PDFDict)) continue;

    for (const [name, value] of xo.entries()) {
      if (!(value instanceof PDFRef)) continue;
      const primaryStr = collapsedToPrimary.get(value.toString());
      if (!primaryStr) continue;
      const primary = refByString.get(primaryStr);
      if (primary) xo.set(name, primary);
    }
  }

  // Step 3: delete collapsed indirect objects.
  for (const refStr of collapsedToPrimary.keys()) {
    const ref = refByString.get(refStr);
    if (ref) context.delete(ref);
  }

  return { collapsed: collapsedToPrimary.size };
}
