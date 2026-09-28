import React from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import VideoPlayerModal from "../components/VideoPlayerModal";

import { Check, CheckCircle, CheckCircle2, Clock, Copy, Download, FileImage, FileVideo, Film, Filter, HardDrive, MoreVertical, Play, Search, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";

export default function MediaLibrary() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedType, setSelectedType] = useState("All")
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [assets, setAssets] = useState([
      {
        id: "media-1",
        title: "Keynote 2025 Architecture Walkthrough",
        type: "video",
        format: "mp4",
        size: "184.2 MB",
        duration: "12:40",
        resolution: "4K UHD (3840x2160)",
        bitrate: "12.4 Mbps",
        url: "https://cdn.contentreach.io/hls/v1/keynote-2025/master.m3u8",
      },
      {
        id: "media-2",
        title: "Serverless Transcoding Architecture Diagram",
        type: "image",
        format: "png",
        size: "2.4 MB",
        duration: "",
        resolution: "2560x1440",
        bitrate: "Lossless",
        url: "https://cdn.contentreach.io/assets/diagrams/arch-v2.png",
      },
      {
        id: "media-3",
        title: "Realtime Audience Retention Demo Clip",
        type: "video",
        format: "webm",
        size: "62.8 MB",
        duration: "03:15",
        resolution: "1080p Full HD",
        bitrate: "5.8 Mbps",
        url: "https://cdn.contentreach.io/hls/v1/retention-demo/master.m3u8",
      },
      {
        id: "media-4",
        title: "Interactive Video Player Component Showcase",
        type: "video",
        format: "mp4",
        size: "94.1 MB",
        duration: "06:05",
        resolution: "1080p Full HD",
        bitrate: "6.2 Mbps",
        url: "https://cdn.contentreach.io/hls/v1/player-showcase/master.m3u8",
      },
      {
        id: "media-5",
        title: "Episode 14 Podcast Video Recording",
        type: "video",
        format: "mp4",
        size: "340.0 MB",
        duration: "24:18",
        resolution: "1080p Full HD",
        bitrate: "4.5 Mbps",
        url: "https://cdn.contentreach.io/hls/v1/podcast-ep14/master.m3u8",
      },
      {
        id: "media-6",
        title: "Developer Documentation Splash Banner",
        type: "image",
        format: "webp",
        size: "820 KB",
        duration: "",
        resolution: "1920x1080",
        bitrate: "WebP Opt",
        url: "https://cdn.contentreach.io/assets/banners/dev-hero.webp",
      },
    ])
    const [selectedAsset, setSelectedAsset] = useState(assets[0])
    const [isPlayerOpen, setIsPlayerOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const handleCopyUrl = (url) => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
    const handlePlayModal = (asset) => {
      setSelectedAsset(asset)
      setIsPlayerOpen(true)
    }
    const handleDeleteAsset = (id) => {
      const filtered = assets.filter((a) => a.id !== id)
      setAssets(filtered)
      if (selectedAsset.id === id && filtered.length > 0) {
        setSelectedAsset(filtered[0])
      }
    }
  return (
   <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 w-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
      <div>
      <div className="flex items-center gap-2.5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Media Asset Library</h1>
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
      48 Assets
      </Badge>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
      Upload, manage, and transcode high-resolution video streams and visual assets for your blog.
      </p>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
      <div className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
      placeholder="Filter media by name..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-8 h-9 text-xs"
      />
      </div>

      <Select value={selectedType} onValueChange={setSelectedType}>
      <SelectTrigger className="w-36 h-9 text-xs">
      <SelectValue placeholder="Media Type" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      <SelectItem value="All">All Media</SelectItem>
      <SelectItem value="Videos">Videos Only</SelectItem>
      <SelectItem value="Images">Images</SelectItem>
      <SelectItem value="Audio">Audio / Podcasts</SelectItem>
      </SelectContent>
      </Select>

      {/* Upload Modal Dialog */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
      <DialogTrigger asChild>
      <Button size="sm" className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm">
      <UploadCloud className="h-4 w-4" />
      <span>Upload Asset</span>
      </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
      <DialogHeader>
      <DialogTitle className="text-lg">Upload Media File</DialogTitle>
      <DialogDescription className="text-xs text-muted-foreground">
      Fast transcoding automatically enables 1080p, 720p HLS adaptive bitrate streams.
      </DialogDescription>
      </DialogHeader>

      <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center space-y-3 bg-muted/20 hover:border-primary transition-colors cursor-pointer">
      <Film className="h-10 w-10 text-primary mx-auto" />
      <div>
      <p className="text-sm font-semibold text-foreground">Drag & drop files or click to browse</p>
      <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WEBM, PNG, JPG (up to 2GB)</p>
      </div>
      <Button size="sm" variant="secondary" className="text-xs">
      Browse Files
      </Button>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
      Cancel
      </Button>
      <Button
      size="sm"
      onClick={() => setUploadModalOpen(false)}
      className="bg-primary text-primary-foreground"
      >
      Start Transcode
      </Button>
      </DialogFooter>
      </DialogContent>
      </Dialog>
      </div>
      </div>
  <div className="flex flex-col lg:flex-row gap-6">
      {/* Media Items Grid */}
      <div className="flex-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {assets.map((asset) => {
      const isSelected = selectedAsset.id === asset.id
      return (
      <Card
      key={asset.id}
      onClick={() => setSelectedAsset(asset)}
      className={`group cursor-pointer overflow-hidden border transition-all duration-200 hover:shadow-md ${
      isSelected
      ? "border-primary ring-2 ring-primary/40 bg-accent/20"
      : "border-border hover:border-border/80 bg-card"
      }`}
      >
      {/* Visual Thumbnail / Player preview */}
      <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Center icon / thumbnail hint */}
      <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-primary transition-all duration-200 shadow-md">
      {asset.type === "video" ? (
      <Play className="h-5 w-5 fill-current translate-x-0.5" />
      ) : (
      <FileImage className="h-5 w-5" />
      )}
      </div>

      {/* Badges on thumbnail */}
      {asset.duration && (
      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white font-mono text-[10px] border-none">
      {asset.duration}
      </Badge>
      )}
      <Badge className="absolute top-2 left-2 bg-black/60 text-white text-[10px] border-none uppercase">
      {asset.format}
      </Badge>
      </div>

      <CardContent className="p-3.5 space-y-1">
      <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
      {asset.title}
      </h3>
      <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0">
      <MoreVertical className="h-3.5 w-3.5" />
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
      <DropdownMenuItem onClick={() => handlePlayModal(asset)}>
      <Play className="h-3.5 w-3.5 mr-2" /> Play Asset
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleCopyUrl(asset.url)}>
      <Copy className="h-3.5 w-3.5 mr-2" /> Copy CDN URL
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
      onClick={() => handleDeleteAsset(asset.id)}
      className="text-destructive focus:text-destructive"
      >
      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
      </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
      <span>{asset.size}</span>
      <span>{asset.resolution}</span>
      </div>
      </CardContent>
      </Card>
      )
      })}
      </div>
      </div>

      {/* Asset Inspector Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
      {/* Storage Quota Card */}
      <Card className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
      <HardDrive className="h-4 w-4 text-primary" />
      <span className="text-xs font-bold text-foreground">CDN Storage Quota</span>
      </div>
      <Badge variant="secondary" className="text-[10px]">28% Used</Badge>
      </div>
      <Progress value={28.4} className="h-2 bg-muted" />
      <div className="flex justify-between text-[11px] text-muted-foreground">
      <span>14.2 GB used</span>
      <span>50.0 GB plan</span>
      </div>
      </Card>

      {/* Selected Asset Details */}
      <Card className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      Asset Inspector
      </span>
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] border-emerald-500/30">
      Transcoded & Cached
      </Badge>
      </div>

      <div className="space-y-3 text-xs">
      <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">File Title</Label>
      <Input
      value={selectedAsset.title}
      onChange={(e) =>
      setSelectedAsset({ ...selectedAsset, title: e.target.value })
      }
      className="h-8 text-xs font-medium"
      />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-3 rounded-xl">
      <div>
      <span className="text-muted-foreground block">Format</span>
      <span className="font-semibold text-foreground uppercase">{selectedAsset.format}</span>
      </div>
      <div>
      <span className="text-muted-foreground block">File Size</span>
      <span className="font-semibold text-foreground">{selectedAsset.size}</span>
      </div>
      <div>
      <span className="text-muted-foreground block">Resolution</span>
      <span className="font-semibold text-foreground">{selectedAsset.resolution}</span>
      </div>
      <div>
      <span className="text-muted-foreground block">Bitrate</span>
      <span className="font-semibold text-foreground">{selectedAsset.bitrate}</span>
      </div>
      </div>

      <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">HLS Master Playlist URL</Label>
      <div className="flex items-center gap-1.5">
      <Input
      readOnly
      value={selectedAsset.url}
      className="h-8 text-[11px] font-mono bg-muted/30"
      />
      <Button
      size="icon"
      variant="outline"
      onClick={() => handleCopyUrl(selectedAsset.url)}
      className="h-8 w-8 shrink-0"
      title="Copy URL"
      >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      </div>
      </div>
      </div>

      <div className="pt-2 space-y-2">
      <Button
      onClick={() => setIsPlayerOpen(true)}
      className="w-full text-xs bg-primary text-primary-foreground h-9 gap-1.5 shadow-sm"
      >
      <Play className="h-3.5 w-3.5 fill-current" />
      Preview in Player
      </Button>
      <Button
      variant="outline"
      className="w-full text-xs h-9 gap-1.5"
      onClick={() => {}}
      >
      <Download className="h-3.5 w-3.5" />
      Download Source
      </Button>
      </div>
      </Card>
      </div>

      {/* Interactive Player Modal */}
      <VideoPlayerModal
      isOpen={isPlayerOpen}
      onOpenChange={setIsPlayerOpen}
      title={selectedAsset.title}
      duration={selectedAsset.duration || "04:12"}
      description="Rendered using ContentReach low-latency edge CDN with adaptive multi-bitrate streams."
      />
      </div>
      </div>
    </div>
  );
}