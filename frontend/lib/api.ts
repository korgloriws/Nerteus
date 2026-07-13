function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

/** Resolve API base URL for server (SSR) and browser (admin/login). */
export function getApiUrl(): string {
  // Browser: same-origin proxy (/api -> backend), avoids CORS and wrong host.
  if (typeof window !== "undefined") {
    return "/api";
  }

  const internalUrl = process.env.API_URL_INTERNAL
    ? stripTrailingSlash(process.env.API_URL_INTERNAL)
    : undefined;
  if (internalUrl) {
    return internalUrl;
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL
    ? stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL)
    : undefined;
  if (publicUrl) {
    return publicUrl;
  }

  return "http://api:8000";
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    next: init?.next,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

/** @deprecated Use getApiUrl() so browser/server resolve the correct host. */
export const API_URL = getApiUrl();
