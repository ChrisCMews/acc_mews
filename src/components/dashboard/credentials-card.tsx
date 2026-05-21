"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  type MewsEnvironment,
  ENV_BASE_URLS,
  ENV_LABELS,
  getActiveEnvironment,
  getEnvCredentials,
  setEnvCredentials,
  setActiveEnvironment,
} from "@/lib/credentials";

const ENVIRONMENTS: MewsEnvironment[] = ["demo", "production"];

export function CredentialsCard() {
  const [activeEnv, setActiveEnvState] = useState<MewsEnvironment>("demo");
  const [tab, setTab] = useState<MewsEnvironment>("demo");
  const [tokens, setTokens] = useState<Record<MewsEnvironment, { clientToken: string; accessToken: string }>>({
    demo: { clientToken: "", accessToken: "" },
    production: { clientToken: "", accessToken: "" },
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const env = getActiveEnvironment();
    setActiveEnvState(env);
    setTab(env);
    setTokens({
      demo: { clientToken: getEnvCredentials("demo").clientToken ?? "", accessToken: getEnvCredentials("demo").accessToken ?? "" },
      production: { clientToken: getEnvCredentials("production").clientToken ?? "", accessToken: getEnvCredentials("production").accessToken ?? "" },
    });
  }, []);

  function updateToken(env: MewsEnvironment, field: "clientToken" | "accessToken", value: string) {
    setTokens((prev) => ({ ...prev, [env]: { ...prev[env], [field]: value } }));
  }

  function handleActivate(env: MewsEnvironment) {
    setEnvCredentials(env, {
      clientToken: tokens[env].clientToken.trim() || undefined,
      accessToken: tokens[env].accessToken.trim() || undefined,
    });
    setActiveEnvironment(env);
    setActiveEnvState(env);
    mutate(() => true, undefined, { revalidate: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleSaveTokens(env: MewsEnvironment) {
    setEnvCredentials(env, {
      clientToken: tokens[env].clientToken.trim() || undefined,
      accessToken: tokens[env].accessToken.trim() || undefined,
    });
    if (env === activeEnv) {
      mutate(() => true, undefined, { revalidate: true });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Mews Connection</CardTitle>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", activeEnv === "demo" ? "bg-yellow-400" : "bg-green-500")} />
            Active: <span className="font-medium text-slate-700">{ENV_LABELS[activeEnv]}</span>
            <span className="font-mono text-slate-400">— {ENV_BASE_URLS[activeEnv]}</span>
          </span>
        </div>
        {/* Environment tabs */}
        <div className="mt-3 flex gap-1 rounded-lg bg-slate-100 p-1">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env}
              onClick={() => setTab(env)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === env
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", env === "demo" ? "bg-yellow-400" : "bg-green-500")} />
              {ENV_LABELS[env]}
              {activeEnv === env && (
                <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  active
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          API Base URL:{" "}
          <span className="font-mono text-slate-700">{ENV_BASE_URLS[tab]}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${tab}-client-token`}>Client Token</Label>
            <Input
              id={`${tab}-client-token`}
              type="password"
              placeholder="E0D439EE…"
              value={tokens[tab].clientToken}
              onChange={(e) => updateToken(tab, "clientToken", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${tab}-access-token`}>Access Token</Label>
            <Input
              id={`${tab}-access-token`}
              type="password"
              placeholder="7059D2C2…"
              value={tokens[tab].accessToken}
              onChange={(e) => updateToken(tab, "accessToken", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeEnv !== tab ? (
            <Button size="sm" onClick={() => handleActivate(tab)}>
              {saved ? "Switched!" : `Switch to ${ENV_LABELS[tab]}`}
            </Button>
          ) : (
            <Button size="sm" onClick={() => handleSaveTokens(tab)}>
              {saved ? "Saved!" : "Save tokens"}
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {activeEnv === tab ? "Currently connected to this environment" : `Currently connected to ${ENV_LABELS[activeEnv]}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
