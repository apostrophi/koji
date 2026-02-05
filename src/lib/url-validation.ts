/**
 * Shared URL validation for SSRF protection.
 *
 * Only allows HTTPS URLs from trusted CDN origins where fal.ai
 * stores generated images. All server-side fetches of user-provided
 * URLs must go through this check.
 */

/** Hostnames allowed with exact or subdomain matching */
const ALLOWED_HOSTNAMES = ["fal.media", "v3.fal.media"];

/**
 * Google Cloud Storage requires additional pathname validation
 * since the hostname is shared across all GCS buckets.
 * fal.ai uses bucket names prefixed with "fal-".
 */
const GCS_HOSTNAME = "storage.googleapis.com";
const GCS_ALLOWED_PATH_PREFIX = "/fal-";

/**
 * Check whether a URL is safe to fetch from the server.
 *
 * Rules:
 * - Must be HTTPS
 * - Must match a trusted hostname (exact or subdomain)
 * - storage.googleapis.com is only allowed with /fal-* paths
 */
export function isAllowedImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // HTTPS only
    if (url.protocol !== "https:") return false;

    // Check fal.ai hostnames (exact + subdomain match)
    const matchesFal = ALLOWED_HOSTNAMES.some(
      (h) => url.hostname === h || url.hostname.endsWith(`.${h}`)
    );
    if (matchesFal) return true;

    // Check GCS with pathname restriction
    if (url.hostname === GCS_HOSTNAME) {
      return url.pathname.startsWith(GCS_ALLOWED_PATH_PREFIX);
    }

    return false;
  } catch {
    return false;
  }
}
