"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getStoredCredentials, setStoredCredentials, clearStoredCredentials } from "@/lib/credentials";

export function CredentialsCard() {
  const [baseUrl, setBaseUrl] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [hasCustom, setHasCustom] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const creds = getStoredCredentials();
    if (creds.baseUrl) setBaseUrl(creds.baseUrl);
    if (creds.clientToken) setClientToken(creds.clientToken);
    if (creds.accessToken) setAccessToken(creds.accessToken);
    setHasCustom(!!(creds.clientToken || creds.accessToken || creds.baseUrl));
  }, []);

  function handleSave() {
    setStoredCredentials({
      baseUrl: baseUrl.trim() || undefined,
      clientToken: clientToken.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
    });
    setHasCustom(!!(clientToken.trim() || accessToken.trim() || baseUrl.trim()));
    mutate(() => true, undefined, { revalidate: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    clearStoredCredentials();
    setBaseUrl("");
    setClientToken("");
    setAccessToken("");
    setHasCustom(false);
    mutate(() => true, undefined, { revalidate: true });
  }

  const activeUrl = baseUrl.trim() || "https://api.mews-demo.com";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${hasCustom ? "bg-green-500" : "bg-yellow-400"}`}
          />
          <CardTitle className="text-base">Mews Connection</CardTitle>
        </div>
        <CardDescription>
          {hasCustom ? "Using custom credentials" : "Using default demo environment"} &mdash;{" "}
          <span className="font-mono text-xs">{activeUrl}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="cred-base-url">API Base URL</Label>
            <Input
              id="cred-base-url"
              placeholder="https://api.mews-demo.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cred-client-token">Client Token</Label>
            <Input
              id="cred-client-token"
              type="password"
              placeholder="E0D439EE…"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cred-access-token">Access Token</Label>
            <Input
              id="cred-access-token"
              type="password"
              placeholder="7059D2C2…"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave}>
            {saved ? "Saved!" : "Save & Reconnect"}
          </Button>
          {hasCustom && (
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset to defaults
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
