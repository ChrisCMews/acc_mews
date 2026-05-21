const STORAGE_KEY = "mews_credentials_v2";

export type MewsEnvironment = "demo" | "production";

export const ENV_BASE_URLS: Record<MewsEnvironment, string> = {
  demo: "https://api.mews-demo.com",
  production: "https://api.mews.com",
};

export const ENV_LABELS: Record<MewsEnvironment, string> = {
  demo: "Demo",
  production: "Production",
};

export interface MewsEnvCredentials {
  clientToken?: string;
  accessToken?: string;
}

export interface MewsCredentialsStore {
  activeEnvironment: MewsEnvironment;
  demo: MewsEnvCredentials;
  production: MewsEnvCredentials;
}

// Shape returned to apiFetcher / extractConfig — unchanged interface
export interface MewsCredentials {
  clientToken: string;
  accessToken: string;
  baseUrl: string;
}

function defaultStore(): MewsCredentialsStore {
  return { activeEnvironment: "demo", demo: {}, production: {} };
}

function readStore(): MewsCredentialsStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    return JSON.parse(raw) as MewsCredentialsStore;
  } catch {
    return defaultStore();
  }
}

function writeStore(store: MewsCredentialsStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  // Notify same-tab listeners (storage event only fires cross-tab natively)
  window.dispatchEvent(new Event("storage"));
}

export function getActiveEnvironment(): MewsEnvironment {
  return readStore().activeEnvironment;
}

export function getEnvCredentials(env: MewsEnvironment): MewsEnvCredentials {
  return readStore()[env];
}

export function setEnvCredentials(env: MewsEnvironment, creds: MewsEnvCredentials): void {
  const store = readStore();
  store[env] = creds;
  writeStore(store);
}

export function setActiveEnvironment(env: MewsEnvironment): void {
  const store = readStore();
  store.activeEnvironment = env;
  writeStore(store);
}

// Used by apiFetcher and extractConfig — returns active env tokens + base URL
export function getStoredCredentials(): Partial<MewsCredentials> {
  const store = readStore();
  const env = store.activeEnvironment;
  const creds = store[env];
  return {
    baseUrl: ENV_BASE_URLS[env],
    clientToken: creds.clientToken,
    accessToken: creds.accessToken,
  };
}

// Legacy: kept for export-form compatibility
export function clearStoredCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
