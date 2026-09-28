import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ArrowLeft, Check, Copy, Key, Send, Settings, Trash2 } from "lucide-react";

interface PlatformItem {
  id: string;
  name: string;
  category: string;
  connected: boolean;
  description: string;
}

export default function AdminApiIntegrations() {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState<PlatformItem[]>([
    {
      id: "youtube",
      name: "YouTube Data API v3",
      category: "Video Hosting",
      connected: true,
      description: "Auto-publish video blogs directly to YouTube channels with synchronized tags, playlists, and descriptions.",
    },
    {
      id: "vimeo",
      name: "Vimeo Enterprise",
      category: "Video Hosting",
      connected: true,
      description: "Direct player embed and video transcoding sync with domain-restricted privacy controls.",
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      category: "Analytics",
      connected: true,
      description: "Stream custom reach, video watch depth, and article scroll events into your measurement suite.",
    },
    {
      id: "hubspot",
      name: "HubSpot CRM",
      category: "Marketing Automation",
      connected: false,
      description: "Sync subscriber leads, gated video downloads, and reader nurture workflows automatically.",
    },
    {
      id: "linkedin",
      name: "LinkedIn Marketing API",
      category: "Social Distribution",
      connected: true,
      description: "Cross-post article summaries and video snippets to corporate company pages.",
    },
    {
      id: "zapier",
      name: "Zapier Webhooks",
      category: "Automation",
      connected: false,
      description: "Trigger custom zap workflows whenever a new blog post is approved or published.",
    },
  ]);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<PlatformItem | null>(null);

  const handleTogglePlatform = (id: string) => {
    setPlatforms(
      platforms.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
    );
  };

  const handleOpenConfig = (platform: PlatformItem) => {
    setActivePlatform(platform);
    setConfigModalOpen(true);
  };

  const [apiKeys, setApiKeys] = useState([
    {
      id: "k-1",
      name: "Production CI/CD Automated Publisher",
      prefix: "cr_live_sec_99a8b",
      created: "Apr 12, 2025",
      lastUsed: "2 mins ago",
    },
    {
      id: "k-2",
      name: "Vimeo Video Sync Worker",
      prefix: "cr_live_sec_4412f",
      created: "May 01, 2025",
      lastUsed: "3 hours ago",
    },
    {
      id: "k-3",
      name: "Zapier Marketing Ingestion",
      prefix: "cr_live_sec_109cd",
      created: "May 10, 2025",
      lastUsed: "Yesterday",
    },
  ]);

  const [webhooks, setWebhooks] = useState([
    {
      id: "wh-1",
      url: "https://marketing-events.contentreach.io/api/v1/blog-sync",
      events: ["post.published", "video.ready"],
      status: "200 OK",
    },
    {
      id: "wh-2",
      url: "https://hooks.slack.com/services/T00/B00/X123456",
      events: ["post.published"],
      status: "200 OK",
    },
  ]);

  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [pingingId, setPingingId] = useState("");

  const handleCopyKey = (id: string) => {
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1500);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleCreateKey = () => {
    const newK = {
      id: "k-" + (apiKeys.length + 1),
      name: "New API Key " + (apiKeys.length + 1),
      prefix: "cr_live_sec_" + Math.random().toString(36).substring(2, 7),
      created: "Today",
      lastUsed: "Never",
    };
    setApiKeys([...apiKeys, newK]);
  };

  const handleAddWebhook = () => {
    if (newWebhookUrl.trim()) {
      setWebhooks([
        ...webhooks,
        {
          id: "wh-" + (webhooks.length + 1),
          url: newWebhookUrl.trim(),
          events: ["post.published"],
          status: "Pending Check",
        },
      ]);
      setNewWebhookUrl("");
    }
  };

  const handlePingWebhook = (id: string) => {
    setPingingId(id);
    window.setTimeout(() => {
      setPingingId("");
    }, 700);
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
                  4 Platforms Connected
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
                  <Input defaultValue="cr_oauth_prod_89401" className="h-9 text-xs font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Webhook Secret / API Token</Label>
                  <Input defaultValue="••••••••••••••••••••••••••••••••" type="password" className="h-9 text-xs font-mono" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Automatic Sync on Publish</p>
                    <p className="text-[11px] text-muted-foreground">Broadcast immediately when story goes live</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setConfigModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setConfigModalOpen(false)} className="bg-primary text-primary-foreground">
                  Save Integration
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
              <Button size="sm" onClick={handleCreateKey} className="text-xs bg-primary text-primary-foreground">
                + Create New Token
              </Button>
            </div>

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
                <Button size="sm" onClick={handleAddWebhook} className="h-8 text-xs">
                  Add URL
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
