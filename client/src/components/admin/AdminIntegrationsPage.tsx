import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, Copy, Key, Send, Settings, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api, useModelDelete, useModelIndex, useModelStore, useModelUpdate } from "@rhino-dev/rhino-react";
import { useBaseOwnerId } from "@/codalio/session";

interface PlatformItem {
  id: string;
  name: string;
  category: string;
  connected: boolean;
  description: string;
}

export default function AdminApiIntegrations() {
  const navigate = useNavigate();
  const baseOwnerId = useBaseOwnerId();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const { data: integrationsResponse } = useModelIndex("integrations", { sort: "name" });
  const { data: tokensResponse } = useModelIndex("api_tokens", { sort: "-created_at" });
  const { data: webhooksResponse } = useModelIndex("webhooks", { sort: "-created_at" });

  const updateIntegration = useModelUpdate("integrations");
  const createToken = useModelStore("api_tokens");
  const deleteToken = useModelDelete("api_tokens");
  const createWebhook = useModelStore("webhooks");
  const updateWebhook = useModelUpdate("webhooks");

  const platforms: PlatformItem[] = (integrationsResponse?.data ?? []).map((row: any) => ({
    id: String(row.id),
    name: row.name ?? "Integration",
    category: row.category ?? "General",
    connected: Boolean(row.connected),
    description: row.description ?? "",
  }));

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<PlatformItem | null>(null);
  const [configClientId, setConfigClientId] = useState("");
  const [configApiKey, setConfigApiKey] = useState("");
  const [configAutoSync, setConfigAutoSync] = useState(true);

  const handleTogglePlatform = (id: string) => {
    const target = platforms.find((p) => p.id === id);
    if (!target) return;
    setErrorMessage("");
    updateIntegration.mutate(
      { id: Number(id), data: { connected: !target.connected } },
      {
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not update the integration."),
      },
    );
  };

  const handleOpenConfig = (platform: PlatformItem) => {
    setActivePlatform(platform);
    setConfigClientId("");
    setConfigApiKey("");
    setConfigAutoSync(true);
    setConfigModalOpen(true);
  };

  const handleSaveIntegration = () => {
    if (!activePlatform) return;
    setErrorMessage("");
    updateIntegration.mutate(
      {
        id: Number(activePlatform.id),
        data: { client_id: configClientId, api_key: configApiKey, auto_sync: configAutoSync },
      },
      {
        onSuccess: () => setConfigModalOpen(false),
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not save the integration."),
      },
    );
  };

  const apiKeys = (tokensResponse?.data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? "API Token",
    prefix: row.token_prefix ?? "",
    created: row.created_at ? new Date(row.created_at).toLocaleDateString("en-US") : "—",
    lastUsed: row.last_used_at ? new Date(row.last_used_at).toLocaleString("en-US") : "Never",
  }));

  const webhooks = (webhooksResponse?.data ?? []).map((row: any) => ({
    id: row.id,
    url: row.url ?? "",
    events: Array.isArray(row.events) ? row.events : [],
    status: row.status ?? "pending",
  }));

  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [pingingId, setPingingId] = useState("");

  const handleCopyKey = (id: string) => {
    const key = apiKeys.find((k) => String(k.id) === String(id));
    if (key && navigator.clipboard) navigator.clipboard.writeText(key.prefix);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1500);
  };

  const handleRevokeKey = (id: string) => {
    setErrorMessage("");
    deleteToken.mutate(Number(id), {
      onError: (err: any) =>
        setErrorMessage(err?.response?.data?.message ?? "Could not revoke the token."),
    });
  };

  const handleCreateKey = () => {
    setErrorMessage("");
    createToken.mutate(
      {
        name: `New API Key ${apiKeys.length + 1}`,
        token_prefix: `cr_live_sec_${Math.random().toString(36).substring(2, 7)}`,
        organization_id: baseOwnerId,
      },
      {
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not create the token."),
      },
    );
  };

  const handleAddWebhook = () => {
    if (!newWebhookUrl.trim()) return;
    setErrorMessage("");
    createWebhook.mutate(
      {
        url: newWebhookUrl.trim(),
        events: ["post.published"],
        status: "pending",
        organization_id: baseOwnerId,
      },
      {
        onSuccess: () => setNewWebhookUrl(""),
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not add the webhook."),
      },
    );
  };

  const handlePingWebhook = async (id: string) => {
    setPingingId(id);
    setErrorMessage("");
    try {
      await api.post(`/webhooks/${id}/ping`);
      queryClient.invalidateQueries({ queryKey: ["modelIndex", "webhooks"] });
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message ?? "Could not ping the webhook.");
    } finally {
      setPingingId("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  API & Marketing Integrations
                </h1>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                  {platforms.filter((p) => p.connected).length} Platforms Connected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect ContentReach to video syndication endpoints, real-time analytics suites, and social broadcasting networks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              onClick={handleCreateKey}
              className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Generate Secret Token</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Syndication & Analytics Channels</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Toggle live syncing with your external marketing tools and video hosting.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((p) => (
              <Card
                key={p.id}
                className={`border transition-all duration-200 rounded-2xl shadow-sm flex flex-col justify-between ${
                  p.connected ? "bg-card border-border hover:border-primary/40" : "bg-muted/20 border-border/60 opacity-80"
                }`}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        p.connected
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.connected ? "Connected" : "Not Linked"}
                    </Badge>
                    <Switch
                      checked={p.connected}
                      onCheckedChange={() => handleTogglePlatform(p.id)}
                    />
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      {p.category}
                    </span>
                    <CardTitle className="text-base font-bold text-foreground mt-0.5">
                      {p.name}
                    </CardTitle>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {p.description}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="pt-0 border-t border-border/50 py-3 mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {p.connected ? "Sync: Active" : "Status: Idle"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenConfig(p)}
                    className="text-xs h-7 text-primary hover:text-primary gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Configure</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Configuration Dialog */}
          <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Configure {activePlatform?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update OAuth credentials, API secrets, and event sync preferences.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Client ID / Account Identifier</Label>
                  <Input
                    value={configClientId}
                    onChange={(e) => setConfigClientId(e.target.value)}
                    placeholder="cr_oauth_prod_89401"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Webhook Secret / API Token</Label>
                  <Input
                    value={configApiKey}
                    onChange={(e) => setConfigApiKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    type="password"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Automatic Sync on Publish</p>
                    <p className="text-[11px] text-muted-foreground">Broadcast immediately when story goes live</p>
                  </div>
                  <Switch checked={configAutoSync} onCheckedChange={setConfigAutoSync} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setConfigModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveIntegration} disabled={updateIntegration.isPending} className="bg-primary text-primary-foreground">
                  {updateIntegration.isPending ? "Saving..." : "Save Integration"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {/* API Keys Card */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Active API Tokens</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Bearers used to authenticate server-to-server video uploads and automated RSS ingest.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleCreateKey} disabled={createToken.isPending} className="text-xs bg-primary text-primary-foreground">
                {createToken.isPending ? "Generating..." : "+ Create New Token"}
              </Button>
            </div>

            {errorMessage ? (
              <p className="text-xs text-destructive">{errorMessage}</p>
            ) : null}

            <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Token Name</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-sm text-foreground">
                        {key.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {key.prefix}••••••••••••••••
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{key.created}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{key.lastUsed}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyKey(key.id)}
                            title="Copy Key"
                          >
                            {copiedId === key.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRevokeKey(key.id)}
                            title="Revoke Token"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Webhooks Section */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Outgoing Webhook Endpoints</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time POST dispatches for `post.published`, `video.transcoded`, and `analytics.milestone`.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://api.yourdomain.com/webhooks"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="h-8 text-xs w-64"
                />
                <Button size="sm" onClick={handleAddWebhook} disabled={createWebhook.isPending} className="h-8 text-xs">
                  {createWebhook.isPending ? "Adding..." : "Add URL"}
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Subscribed Events</TableHead>
                    <TableHead className="w-28 text-center">Last Status</TableHead>
                    <TableHead className="w-28 text-right">Ping Test</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((wh) => (
                    <TableRow key={wh.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-foreground">
                        {wh.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map((ev) => (
                            <Badge key={ev} variant="secondary" className="text-[10px] font-mono">
                              {ev}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          {wh.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => handlePingWebhook(wh.id)}
                        >
                          <Send className="h-3 w-3" />
                          <span>{pingingId === wh.id ? "Pinging..." : "Test Ping"}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
