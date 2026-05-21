import { getStoredCredentials } from "./credentials";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiFetcher(url: string): Promise<any> {
  if (typeof window === "undefined") {
    return fetch(url).then((r) => r.json());
  }

  const creds = getStoredCredentials();
  const headers: Record<string, string> = {};

  if (creds.clientToken) headers["x-mews-client-token"] = creds.clientToken;
  if (creds.accessToken) headers["x-mews-access-token"] = creds.accessToken;
  if (creds.baseUrl) headers["x-mews-base-url"] = creds.baseUrl;

  return fetch(url, { headers }).then((r) => r.json());
}
