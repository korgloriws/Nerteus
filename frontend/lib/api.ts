function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Resolve API base URL for server (SSR) and browser (admin/login). */
export function getApiUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL
    ? stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL)
    : undefined;
  const internalUrl = process.env.API_URL_INTERNAL
    ? stripTrailingSlash(process.env.API_URL_INTERNAL)
    : undefined;

  // Browser: never call localhost — use the same host as the site.
  if (typeof window !== "undefined") {
    if (publicUrl && !isLocalhostUrl(publicUrl)) {
      return publicUrl;
    }
    return `http://${window.location.hostname}:8000`;
  }

  // Server inside Docker: talk to the api service directly.
  if (internalUrl) {
    return internalUrl;
  }
  if (publicUrl && !isLocalhostUrl(publicUrl)) {
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
