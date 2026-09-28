import React from "react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

import { AlertTriangle, ArrowLeft, Building, Check, Film, KeyRound, Lock, ShieldCheck, Sliders, Sparkles, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSystemSettings() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("general")
    const [orgName, setOrgName] = useState("ContentReach Media Inc.")
    const [domain, setDomain] = useState("blog.contentreach.io")
    const [contactEmail, setContactEmail] = useState("editor@contentreach.io")
    const [isOrgSaved, setIsOrgSaved] = useState(false)
    const [transcodePreset, setTranscodePreset] = useState("1080p")
    const [maxUploadSize, setMaxUploadSize] = useState("1024mb")
    const [autoCaptions, setAutoCaptions] = useState(true)
    const [autoChapters, setAutoChapters] = useState(true)
    const [isVideoSaved, setIsVideoSaved] = useState(false)
    const handleSaveOrg = () => {
      setIsOrgSaved(true)
      window.setTimeout(() => setIsOrgSaved(false), 2000)
    }
    const handleSaveVideo = () => {
      setIsVideoSaved(true)
      window.setTimeout(() => setIsVideoSaved(false), 2000)
    }
    const [enforce2FA, setEnforce2FA] = useState(true)
    const [sessionTimeout, setSessionTimeout] = useState("60")
    const [ssoProvider, setSsoProvider] = useState("okta")
    const [isSaved, setIsSaved] = useState(false)
    const handleSave = () => {
      setIsSaved(true)
      window.setTimeout(() => setIsSaved(false), 2000)
    }
  return (
   <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 w-full min-w-0">
          <div className="space-y-4 pb-4 border-b border-border">
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
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
      System & Security Governance
      </h1>
      <p className="text-xs text-muted-foreground mt-0.5">
      Manage company details, media transcoding limits, SSO authentication, and CDN distribution policies.
      </p>
      </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-muted/70 flex-wrap h-auto p-1 gap-1">
      <TabsTrigger value="general" className="text-xs">General & Organization</TabsTrigger>
      <TabsTrigger value="encoding" className="text-xs">Content & Video Encoding</TabsTrigger>
      <TabsTrigger value="security" className="text-xs">Security & Compliance</TabsTrigger>
      <TabsTrigger value="storage" className="text-xs">Storage & CDN</TabsTrigger>
      </TabsList>
      </Tabs>
      </div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Organization Details Form */}
      <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
      <div className="flex items-center gap-2.5">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
      <Building className="h-5 w-5" />
      </div>
      <div>
      <CardTitle className="text-base font-bold text-foreground">
      Organization Identity
      </CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">
      Public branding, custom domain aliases, and editorial signature.
      </CardDescription>
      </div>
      </div>

      <div className="space-y-3 text-xs">
      <div className="space-y-1">
      <Label className="text-xs">Company Name</Label>
      <Input
      value={orgName}
      onChange={(e) => setOrgName(e.target.value)}
      className="h-9 text-xs"
      />
      </div>

      <div className="space-y-1">
      <Label className="text-xs">Custom Blog Domain</Label>
      <div className="flex items-center rounded-lg border border-input px-3 h-9 text-xs font-mono bg-muted/20">
      <span className="text-muted-foreground mr-1">https://</span>
      <input
      value={domain}
      onChange={(e) => setDomain(e.target.value)}
      className="w-full bg-transparent outline-none text-foreground"
      />
      </div>
      </div>

      <div className="space-y-1">
      <Label className="text-xs">Editorial Contact Email</Label>
      <Input
      value={contactEmail}
      onChange={(e) => setContactEmail(e.target.value)}
      className="h-9 text-xs"
      />
      </div>

      <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
      <div className="space-y-0.5">
      <p className="font-semibold text-foreground">Organization Logo</p>
      <p className="text-[11px] text-muted-foreground">Used on social share cards and email feeds</p>
      </div>
      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
      <UploadCloud className="h-3.5 w-3.5" />
      <span>Change</span>
      </Button>
      </div>
      </div>
      </div>

      <CardFooter className="p-0 pt-4 border-t border-border flex justify-end">
      <Button
      size="sm"
      onClick={handleSaveOrg}
      disabled={isOrgSaved}
      className="text-xs bg-primary text-primary-foreground gap-1.5"
      >
      {isOrgSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
      <span>{isOrgSaved ? "Changes Saved" : "Save Organization Info"}</span>
      </Button>
      </CardFooter>
      </Card>

      {/* Video Encoding Settings Card */}
      <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
      <Film className="h-5 w-5" />
      </div>
      <div>
      <CardTitle className="text-base font-bold text-foreground">
      Video Transcoding & HLS
      </CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">
      Control media rendering pipeline quality and automated AI captions.
      </CardDescription>
      </div>
      </div>
      <Badge className="bg-primary/10 text-primary text-[10px]">Adaptive HLS</Badge>
      </div>

      <div className="space-y-3 text-xs">
      <div className="space-y-1">
      <Label className="text-xs">Default Transcode Target Quality</Label>
      <Select value={transcodePreset} onValueChange={setTranscodePreset}>
      <SelectTrigger className="h-9 text-xs">
      <SelectValue placeholder="Select preset" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      <SelectItem value="1080p">1080p Full HD (Balanced)</SelectItem>
      <SelectItem value="4k">4K Ultra HD (Maximum Detail)</SelectItem>
      <SelectItem value="720p">720p Mobile-Optimized (Lowest Bandwidth)</SelectItem>
      </SelectContent>
      </Select>
      </div>

      <div className="space-y-1">
      <Label className="text-xs">Max Single Video Upload File Size</Label>
      <Select value={maxUploadSize} onValueChange={setMaxUploadSize}>
      <SelectTrigger className="h-9 text-xs">
      <SelectValue placeholder="Select size limit" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      <SelectItem value="500mb">500 MB per asset</SelectItem>
      <SelectItem value="1024mb">1,024 MB (1.0 GB)</SelectItem>
      <SelectItem value="2048mb">2,048 MB (2.0 GB)</SelectItem>
      </SelectContent>
      </Select>
      </div>

      <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
      <div className="space-y-0.5">
      <span className="font-semibold text-foreground block">Auto-generate Multi-language Captions</span>
      <span className="text-[11px] text-muted-foreground">Speech-to-text indexing for SEO and accessibility</span>
      </div>
      <Switch checked={autoCaptions} onCheckedChange={setAutoCaptions} />
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
      <div className="space-y-0.5">
      <span className="font-semibold text-foreground block">AI Smart Video Chapters</span>
      <span className="text-[11px] text-muted-foreground">Extract scene change markers and titles automatically</span>
      </div>
      <Switch checked={autoChapters} onCheckedChange={setAutoChapters} />
      </div>
      </div>
      </div>
      </div>

      <CardFooter className="p-0 pt-4 border-t border-border flex justify-end">
      <Button
      size="sm"
      onClick={handleSaveVideo}
      disabled={isVideoSaved}
      className="text-xs bg-primary text-primary-foreground gap-1.5"
      >
      {isVideoSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
      <span>{isVideoSaved ? "Presets Saved" : "Save Transcoding Rules"}</span>
      </Button>
      </CardFooter>
      </Card>
      </div>
  <Card className="w-full bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
      <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
      <CardTitle className="text-lg font-bold text-foreground">
      Security, Authentication & SSO Policies
      </CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">
      Enforce enterprise guardrails, single sign-on providers, and idle session policies.
      </CardDescription>
      </div>
      </div>

      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
      SOC2 Type II Compliant
      </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      {/* 2FA and Session */}
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
      <div className="flex items-center justify-between">
      <div className="space-y-0.5">
      <Label className="text-xs font-semibold text-foreground">Enforce Multi-Factor Authentication (2FA)</Label>
      <p className="text-[11px] text-muted-foreground">Require all users to link authenticator apps before publishing</p>
      </div>
      <Switch checked={enforce2FA} onCheckedChange={setEnforce2FA} />
      </div>

      <div className="space-y-1.5 pt-3 border-t border-border/60">
      <Label className="text-xs">Idle Session Timeout</Label>
      <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
      <SelectTrigger className="h-9 text-xs bg-card">
      <SelectValue placeholder="Select timeout" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      <SelectItem value="15">15 Minutes</SelectItem>
      <SelectItem value="30">30 Minutes</SelectItem>
      <SelectItem value="60">60 Minutes (Recommended)</SelectItem>
      <SelectItem value="480">8 Hours</SelectItem>
      </SelectContent>
      </Select>
      </div>
      </div>

      {/* SSO Directory Sync */}
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
      <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground">Enterprise Identity Provider (SSO)</Label>
      <Select value={ssoProvider} onValueChange={setSsoProvider}>
      <SelectTrigger className="h-9 text-xs bg-card">
      <SelectValue placeholder="Select SSO" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      <SelectItem value="okta">Okta SAML 2.0 / OIDC</SelectItem>
      <SelectItem value="azure">Microsoft Entra ID (Azure AD)</SelectItem>
      <SelectItem value="google">Google Workspace Enterprise</SelectItem>
      <SelectItem value="custom">Custom OIDC Endpoint</SelectItem>
      </SelectContent>
      </Select>
      </div>

      <div className="flex items-center justify-between text-xs pt-2">
      <span className="text-muted-foreground">SCIM User Provisioning</span>
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
      Synchronized
      </Badge>
      </div>
      </div>
      </div>

      <Alert className="bg-primary/5 border-primary/20 text-xs py-2.5">
      <KeyRound className="h-4 w-4 text-primary" />
      <AlertDescription className="text-xs text-muted-foreground ml-2">
      Changes to authentication policies will invalidate current non-admin sessions after a 10-minute grace period.
      </AlertDescription>
      </Alert>

      <div className="flex justify-end border-t border-border pt-4">
      <Button
      size="sm"
      onClick={handleSave}
      disabled={isSaved}
      className="text-xs bg-primary text-primary-foreground gap-1.5"
      >
      {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
      <span>{isSaved ? "Security Policies Enforced" : "Update Security Baseline"}</span>
      </Button>
      </div>
      </Card>
      </div>
    </div>
  );
}