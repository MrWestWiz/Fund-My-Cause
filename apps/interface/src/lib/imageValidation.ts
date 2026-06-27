/**
 * Image validation utilities for campaign image uploads.
 * Enforces file type and file size constraints before any upload is attempted.
 */

/** Accepted MIME types for campaign images */
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Maximum allowed file size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a File object against the accepted MIME types and maximum size.
 * Type check runs first — if both fail, the type error is returned.
 *
 * @param file - The File to validate
 * @returns A ValidationResult indicating success or the first error found
 */
export function validateImageFile(file: File): ValidationResult {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { valid: false, error: "Only PNG, JPG, or WebP images are allowed." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Image must be under 5 MB." };
  }
  return { valid: true };
}

// ── Fallback image helpers ────────────────────────────────────────────────────

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1555949963-aa79dcee5789?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1569617083954-66f5f4c6adb9?auto=format&fit=crop&q=80&w=800",
];

/**
 * Returns a deterministic fallback image URL for a given campaign ID.
 * The same campaign ID always maps to the same fallback image.
 *
 * @param id - The campaign contract ID
 * @returns A fallback image URL string
 */
export function getFallbackImage(id: string): string {
  // Simple hash: sum char codes modulo number of fallbacks
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % FALLBACK_IMAGES.length;
  }
  return FALLBACK_IMAGES[hash];
}

/**
 * Returns true if the URI is a non-empty string that looks like a valid image URI.
 * Accepts http(s), ipfs:// and data: URIs.
 *
 * @param uri - Image URI to check
 */
export function isValidImageUri(uri?: string): boolean {
  if (!uri || uri.trim() === "") return false;
  return (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("ipfs://") ||
    uri.startsWith("data:")
  );
}
