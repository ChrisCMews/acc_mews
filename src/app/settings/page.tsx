import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function maskToken(token: string | undefined) {
  if (!token) return "Not configured";
  return token.slice(0, 8) + "…" + token.slice(-4);
}

export default function SettingsPage() {
  const clientToken = process.env.MEWS_CLIENT_TOKEN;
  const accessToken = process.env.MEWS_ACCESS_TOKEN;
  const apiBaseUrl = process.env.MEWS_API_BASE_URL ?? "https://api.mews-demo.com";
  const isConfigured = !!(clientToken && accessToken);

  return (
    <div>
      <Header
        title="Settings"
        description="API credentials and connection configuration"
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mews API Connection</CardTitle>
              <Badge variant={isConfigured ? "success" : "destructive"}>
                {isConfigured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            <CardDescription>
              Credentials are read from environment variables at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1">
              <p className="text-sm font-medium">API Base URL</p>
              <p className="font-mono text-sm text-muted-foreground">{apiBaseUrl}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Client Token</p>
              <p className="font-mono text-sm text-muted-foreground">{maskToken(clientToken)}</p>
              <p className="text-xs text-muted-foreground">env var: MEWS_CLIENT_TOKEN</p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Access Token</p>
              <p className="font-mono text-sm text-muted-foreground">{maskToken(accessToken)}</p>
              <p className="text-xs text-muted-foreground">env var: MEWS_ACCESS_TOKEN</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updating Credentials</CardTitle>
            <CardDescription>
              Credentials are stored as environment variables and never exposed to the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">For local development:</p>
            <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
              <li>Create a <code className="rounded bg-muted px-1">.env.local</code> file in the project root</li>
              <li>Add <code className="rounded bg-muted px-1">MEWS_CLIENT_TOKEN=your_token</code></li>
              <li>Add <code className="rounded bg-muted px-1">MEWS_ACCESS_TOKEN=your_token</code></li>
              <li>Restart the dev server</li>
            </ol>
            <p className="mt-4 font-medium">For Vercel deployment:</p>
            <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
              <li>Open your Vercel project dashboard</li>
              <li>Navigate to Settings → Environment Variables</li>
              <li>Add <code className="rounded bg-muted px-1">MEWS_CLIENT_TOKEN</code> and <code className="rounded bg-muted px-1">MEWS_ACCESS_TOKEN</code></li>
              <li>Redeploy the project</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
