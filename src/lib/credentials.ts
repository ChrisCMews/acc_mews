const STORAGE_KEY = "mews_credentials";

export interface MewsCredentials {
  clientToken: string;
  accessToken: string;
  baseUrl: string;
}

export function getStoredCredentials(): Partial<MewsCredentials> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<MewsCredentials>;
  } catch {
    return {};
  }
}

export function setStoredCredentials(creds: Partial<MewsCredentials>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function clearStoredCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
