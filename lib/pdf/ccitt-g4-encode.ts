// Adapter over ts-ccitt-g4-encoder. Isolated behind this module so the
// upstream dependency can be swapped without touching callers.
import { encode } from 'ts-ccitt-g4-encoder'

export function encodeG4(
  packed1bit: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  return encode(packed1bit, width, height)
}
