/** The Supabase Storage bucket event images live in. */
export const IMAGE_BUCKET = "event-images";

/** Biggest image we accept. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** How long an image link stays valid. */
export const IMAGE_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Works out what a file really is by looking at its first few bytes.
 *
 * Why not trust the browser? Because the filename and `file.type` both
 * come from whoever is uploading, and both can claim "image/jpeg" about a
 * file that is not one. These first bytes are part of the actual format.
 *
 * Returns null if it is not an image type we accept.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  const startsWith = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    startsWithAt(bytes, 8, 0x57, 0x45, 0x42, 0x50)
  )
    return "image/webp";

  return null;
}

function startsWithAt(
  bytes: Uint8Array,
  offset: number,
  ...signature: number[]
) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}
