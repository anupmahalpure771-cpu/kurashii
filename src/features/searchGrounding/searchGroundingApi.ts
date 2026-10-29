/**
 * Client API for Google Search Grounding with gemini-3.8-flash.
 */

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchGroundingResult {
  text: string;
  sources: GroundingSource[];
  searchQueries: string[];
}

export async function querySearchGrounding(
  prompt: string,
  context?: string
): Promise<SearchGroundingResult> {
  // VITE_API_BASE lets static builds (GitHub Pages, the Android app) call a
  // separately hosted Kurashii server, e.g. https://kurashii-xyz.run.app
  const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
  const response = await fetch(`${apiBase}/api/search-grounding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, context }),
  });

  if (response.status === 404 || response.status === 405) {
    throw new Error(
      'Google Intel needs the Kurashii server, which is not included in this build. Deploy the server and set VITE_API_BASE to enable it.'
    );
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error || `Search grounding request failed (${response.status})`
    );
  }

  return response.json();
}
