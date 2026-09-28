import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { Activity, ArrowRight, CheckCircle2, Database, ExternalLink, FileText, HardDrive, Plug, RefreshCw, Server, ShieldCheck, Sliders, Sparkles, Users, Wifi } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@rhino-dev/rhino-react";

export default function Admin() {
    const navigate = useNavigate()
    const { data: health, refetch, isFetching } = useQuery({
      queryKey: ["system-health"],
      queryFn: async () => (await api.get("/system/health")).data,
    })
    const modules = [
      {
        title: "User & Role Management",
        description: "Manage editorial staff, assign author and admin roles, enforce SSO permissions, and manage directory invitations.",
        icon: Users,
        path: "/admin/users",
        stats: "12 Active Users",
      },
      {
        title: "API & Marketing Integrations",
        description: "Configure outgoing webhooks, YouTube/Vimeo transcoding sync, Google Analytics 4 pipelines, and secret API keys.",
        icon: Plug,
        path: "/admin/api-integrations",
        stats: "5 Connected Apps",
      },
      {
        title: "System & Security Settings",
        description: "Enforce multi-factor authentication, session timeouts, SAML 2.0 identity providers, and custom domain routing.",
        icon: Sliders,
        path: "/admin/system-settings",
        stats: "2FA Enforced",
      },
      {
        title: "System Health & Reports",
        description: "Audit compliance logs, transcode queue throughput, bandwidth usage metrics, and scheduled reporting archives.",
        icon: FileText,
        path: "/admin/system-reports",
        stats: "99.98% Uptime",
      },
    ]
    const [isRefreshing, setIsRefreshing] = useState(false)
    const handleRefresh = () => {
      setIsRefreshing(true)
      refetch().finally(() => setIsRefreshing(false))
    }
  return (
   <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 w-full min-w-0">
          <Card className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/40 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
      <div className="space-y-3 max-w-2xl">
      <div className="flex items-center gap-2">
      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs font-semibold px-2.5 py-0.5">
      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
      Enterprise Control Plane
      </Badge>
      <span className="text-xs text-white/60">Cluster: us-east-prod-1</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
      ContentReach Administration
      </h1>

      <p className="text-sm text-white/80 leading-relaxed">
      Centralized portal for team governance, SSO directory sync, API webhooks, edge CDN configuration, and compliance audits.
      </p>

      <div className="flex items-center gap-4 text-xs text-white/70 pt-1">
      <span>Organization: <strong className="text-white">ContentReach Enterprise</strong></span>
      <span>•</span>
      <span>Plan: <strong className="text-indigo-300">Enterprise Scale (50TB CDN)</strong></span>
      </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
      <Button
      variant="secondary"
      onClick={() => navigate("/admin/system-settings")}
      className="text-xs h-9 bg-white/10 hover:bg-white/20 text-white border-white/20"
      >
      <Sliders className="h-3.5 w-3.5 mr-1.5" />
      Configure Policies
      </Button>

      <Button
      onClick={() => navigate("/admin/system-reports")}
      className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
      >
      <Server className="h-3.5 w-3.5 mr-1.5" />
      Live Health Monitor
      </Button>
      </div>
      </div>
      </Card>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {modules.map((mod) => (
      <Card
      key={mod.title}
      data-testid={`admin-module-${mod.path}`}
      className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group"
      >
      <CardHeader>
      <div className="flex items-center justify-between gap-2">
      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
      <mod.icon className="h-5 w-5" />
      </div>
      <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
      {mod.stats}
      </Badge>
      </div>
      <CardTitle className="text-lg font-bold text-foreground mt-3">
      {mod.title}
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
      {mod.description}
      </CardDescription>
      </CardHeader>

      <CardFooter className="pt-0 border-t border-border/60 mt-4 py-4 flex items-center justify-between">
      <span className="text-xs text-muted-foreground font-mono">{mod.path}</span>
      <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(mod.path)}
      className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform gap-1"
      >
      <span>Open Module</span>
      <ArrowRight className="h-3.5 w-3.5" />
      </Button>
      </CardFooter>
      </Card>
      ))}
      </div>
  <Card className="w-full bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      <Activity className="h-5 w-5" />
      </div>
      <div>
      <div className="flex items-center gap-2">
      <CardTitle className="text-lg font-bold text-foreground">
      Infrastructure & CDN Health
      </CardTitle>
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
      All Systems Operational
      </Badge>
      </div>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">
      Realtime telemetry from AWS Edge locations and Cloudflare enterprise tunnels.
      </CardDescription>
      </div>
      </div>

      <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="text-xs h-8 gap-1.5"
      >
      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
      <span>{isRefreshing ? "Polling..." : "Check Status"}</span>
      </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5 text-emerald-500" /> {health?.api_gateway?.label ?? "API Gateway"}</span>
      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{health?.api_gateway?.status ?? "—"}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{health?.api_gateway?.value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground">{health?.api_gateway?.detail ?? ""}</p>
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-sky-500" /> {health?.db_replica?.label ?? "DB Read Replica"}</span>
      <span className="font-semibold text-sky-600 dark:text-sky-400">{health?.db_replica?.status ?? "—"}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{health?.db_replica?.value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground">{health?.db_replica?.detail ?? ""}</p>
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5 text-indigo-500" /> {health?.video_storage?.label ?? "Video Storage"}</span>
      <span className="font-semibold text-foreground">{health?.video_storage?.value ?? "—"}</span>
      </div>
      <Progress value={64} className="h-2 bg-muted" />
      <p className="text-[11px] text-muted-foreground">{health?.video_storage?.status ?? ""}</p>
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {health?.security_perimeter?.label ?? "Security Perimeter"}</span>
      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{health?.security_perimeter?.status ?? "—"}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{health?.security_perimeter?.value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground">{health?.security_perimeter?.detail ?? ""}</p>
      </div>
      </div>
      </Card>
      </div>
    </div>
  );
}