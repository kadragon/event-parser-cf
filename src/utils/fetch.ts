/**
 * Fetch with timeout using AbortController
 *
 * Wraps the native fetch API with a timeout mechanism to prevent hanging requests.
 * Uses AbortController to cancel the request if it exceeds the specified timeout.
 *
 * @param url - URL to fetch
 * @param options - Fetch options (headers, method, body, etc.)
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise<Response>
 * @throws {Error} If request times out or fails
 *
 * @example
 * ```typescript
 * const response = await fetchWithTimeout(
 *   'https://api.example.com/data',
 *   { method: 'GET', headers: { 'Content-Type': 'application/json' } },
 *   5000
 * );
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
