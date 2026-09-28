import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import VideoPlayerModal from "@/components/shared/VideoPlayerModal";

import { Check, CheckCircle, CheckCircle2, Clock, Copy, Download, FileImage, FileVideo, Film, Filter, HardDrive, MoreVertical, Play, Search, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useModelDelete, useModelIndex, useModelStore, useModelUpdate } from "@rhino-dev/rhino-react";
import { useBaseOwnerId, useUser } from "@/codalio/session";

export default function MediaLibrary() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedType, setSelectedType] = useState("All")
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [uploadTitle, setUploadTitle] = useState("")
    const [uploadUrl, setUploadUrl] = useState("")
    const [uploadFormat, setUploadFormat] = useState("mp4")
    const [uploadSize, setUploadSize] = useState("")
    const [uploadResolution, setUploadResolution] = useState("")
    const [uploadBitrate, setUploadBitrate] = useState("")
    const [uploadDuration, setUploadDuration] = useState("")

    const baseOwnerId = useBaseOwnerId()
    const user = useUser()

    const typeFilter = selectedType === "Videos" ? "video" : selectedType === "Images" ? "image" : selectedType === "Audio" ? "audio" : undefined

    const { data: videosResponse, isLoading } = useModelIndex("videos", {
      filters: typeFilter ? { media_type: typeFilter } : undefined,
      search: searchTerm || undefined,
      sort: "-created_at",
    })

    const createVideo = useModelStore("videos")
    const updateVideo = useModelUpdate("videos")
    const deleteVideo = useModelDelete("videos")

    const assets = (videosResponse?.data ?? []).map((video: any) => ({
      id: video.id,
      title: video.title ?? "Untitled asset",
      type: video.media_type ?? "video",
      format: video.format ?? "",
      size: video.file_size ?? "—",
      duration: video.duration ?? "",
      resolution: video.resolution ?? "—",
      bitrate: video.bitrate ?? "—",
      url: video.url ?? "",
    }))

    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
    const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? assets[0] ?? null
    const [isPlayerOpen, setIsPlayerOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const handleCopyUrl = (url) => {
      if (url && navigator.clipboard) navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
    const handlePlayModal = (asset) => {
      setSelectedAssetId(asset.id)
      setIsPlayerOpen(true)
    }
    const handleDeleteAsset = (id) => {
      setErrorMessage("")
      deleteVideo.mutate(id, {
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not delete the asset."),
      })
    }
    const handleRenameAsset = (title) => {
      if (!selectedAsset) return
      setErrorMessage("")
      updateVideo.mutate(
        { id: selectedAsset.id, data: { title } },
        {
          onError: (err: any) =>
            setErrorMessage(err?.response?.data?.message ?? "Could not rename the asset."),
        },
      )
    }
    const handleStartTranscode = () => {
      setErrorMessage("")
      createVideo.mutate(
        {
          title: uploadTitle || "Untitled asset",
          url: uploadUrl || "https://cdn.contentreach.io/hls/v1/untitled/master.m3u8",
          media_type: selectedType === "Images" ? "image" : "video",
          format: uploadFormat,
          file_size: uploadSize || null,
          resolution: uploadResolution || null,
          bitrate: uploadBitrate || null,
          duration_seconds: uploadDuration ? Number(uploadDuration) : null,
          status: "ready",
          organization_id: baseOwnerId,
          user_id: user?.id,
        },
        {
          onSuccess: () => {
            setUploadModalOpen(false)
            setUploadTitle("")
            setUploadUrl("")
            setUploadSize("")
            setUploadResolution("")
            setUploadBitrate("")
            setUploadDuration("")
          },
          onError: (err: any) =>
            setErrorMessage(err?.response?.data?.message ?? "Could not create the asset."),
        },
      )
    }
  return (
   <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 w-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
      <div>
      <div className="flex items-center gap-2.5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Media Asset Library</h1>
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
      {assets.length} Assets
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

      <div className="space-y-3">
      <div className="space-y-1.5">
      <Label className="text-xs">Asset Title</Label>
      <Input
      value={uploadTitle}
      onChange={(e) => setUploadTitle(e.target.value)}
      placeholder="e.g. Keynote 2025 Architecture Walkthrough"
      className="h-9 text-xs"
      />
      </div>
      <div className="space-y-1.5">
      <Label className="text-xs">Source / CDN URL</Label>
      <Input
      value={uploadUrl}
      onChange={(e) => setUploadUrl(e.target.value)}
      placeholder="https://cdn.contentreach.io/hls/v1/.../master.m3u8"
      className="h-9 text-xs font-mono"
      />
      </div>
      <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
      <Label className="text-xs">Format</Label>
      <Input
      value={uploadFormat}
      onChange={(e) => setUploadFormat(e.target.value)}
      className="h-9 text-xs"
      />
      </div>
      <div className="space-y-1.5">
      <Label className="text-xs">File Size</Label>
      <Input
      value={uploadSize}
      onChange={(e) => setUploadSize(e.target.value)}
      placeholder="184.2 MB"
      className="h-9 text-xs"
      />
      </div>
      <div className="space-y-1.5">
      <Label className="text-xs">Resolution</Label>
      <Input
      value={uploadResolution}
      onChange={(e) => setUploadResolution(e.target.value)}
      placeholder="1080p Full HD"
      className="h-9 text-xs"
      />
      </div>
      <div className="space-y-1.5">
      <Label className="text-xs">Bitrate</Label>
      <Input
      value={uploadBitrate}
      onChange={(e) => setUploadBitrate(e.target.value)}
      placeholder="5.8 Mbps"
      className="h-9 text-xs"
      />
      </div>
      </div>
      <div className="space-y-1.5">
      <Label className="text-xs">Duration (seconds)</Label>
      <Input
      type="number"
      value={uploadDuration}
      onChange={(e) => setUploadDuration(e.target.value)}
      placeholder="760"
      className="h-9 text-xs"
      />
      </div>
      {errorMessage ? (
      <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
      Cancel
      </Button>
      <Button
      size="sm"
      onClick={handleStartTranscode}
      disabled={createVideo.isPending}
      className="bg-primary text-primary-foreground"
      >
      {createVideo.isPending ? "Transcoding..." : "Start Transcode"}
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
      {isLoading ? (
      <p className="text-sm text-muted-foreground py-8 col-span-full text-center">Loading media assets…</p>
      ) : assets.length === 0 ? (
      <p className="text-sm text-muted-foreground py-8 col-span-full text-center">No media assets yet. Upload one to get started.</p>
      ) : assets.map((asset) => {
      const isSelected = selectedAsset && selectedAsset.id === asset.id
      return (
      <Card
      key={asset.id}
      onClick={() => setSelectedAssetId(asset.id)}
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

      {selectedAsset ? (
      <div className="space-y-3 text-xs">
      <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">File Title</Label>
      <Input
      value={selectedAsset.title}
      onChange={(e) => handleRenameAsset(e.target.value)}
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
      ) : (
      <p className="text-xs text-muted-foreground">Select an asset to inspect its details.</p>
      )}

      <div className="pt-2 space-y-2">
      <Button
      onClick={() => setIsPlayerOpen(true)}
      disabled={!selectedAsset}
      className="w-full text-xs bg-primary text-primary-foreground h-9 gap-1.5 shadow-sm"
      >
      <Play className="h-3.5 w-3.5 fill-current" />
      Preview in Player
      </Button>
      <Button
      variant="outline"
      className="w-full text-xs h-9 gap-1.5"
      onClick={() => handleCopyUrl(selectedAsset ? selectedAsset.url : "")}
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
      title={selectedAsset ? selectedAsset.title : "Video Preview"}
      duration={(selectedAsset && selectedAsset.duration) || "04:12"}
      description="Rendered using ContentReach low-latency edge CDN with adaptive multi-bitrate streams."
      />
      </div>
      </div>
    </div>
  );
}