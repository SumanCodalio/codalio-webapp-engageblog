import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, Clock, Eye, FileVideo, Globe, Link2, Lock, MoreHorizontal, Play, Plus, Save, Search, Send, Share2, Sparkles, UploadCloud, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModelIndex, useModelShow, useModelStore, useModelUpdate } from "@rhino-dev/rhino-react";
import { useBaseOwnerId, useUser } from "@/codalio/session";

export default function CreatePost() {
    const navigate = useNavigate()
    const { postId } = useParams()
    const isEdit = Boolean(postId)
    const baseOwnerId = useBaseOwnerId()
    const user = useUser()
    const { data: existingPost } = useModelShow("posts", postId, { includes: ["videos"] })
    const { data: videosResponse } = useModelIndex("videos", { sort: "-created_at" })
    const createPost = useModelStore("posts")
    const updatePost = useModelUpdate("posts")
    const createVideo = useModelStore("videos")
    const updateVideo = useModelUpdate("videos")
    const [errorMessage, setErrorMessage] = useState("")
    const [savedStatus, setSavedStatus] = useState("Draft")
    const [lastSavedTime, setLastSavedTime] = useState("Just now")
    const [isSaving, setIsSaving] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const categories = [
      "Engineering",
      "Product Updates",
      "Video Tutorials",
      "Industry Insights",
      "Case Studies",
    ]
    const [title, setTitle] = useState("Architecting Distributed Video Blogs for High-Retention Readership")
    const [slug, setSlug] = useState("architecting-distributed-video-blogs")
    const [category, setCategory] = useState("Engineering")
    const [tags, setTags] = useState(["streaming", "react", "cdn", "architecture"])
    const [newTag, setNewTag] = useState("")
    const [bodyText, setBodyText] = useState(`In this comprehensive technical breakdown, we explore how distributed video delivery combined with traditional editorial prose boosts audience engagement metrics across modern web applications.

    ### 1. The Challenge with Monolithic Video Delivery
    Traditional video embeds often slow down First Contentful Paint (FCP) and introduce heavy script bundles. By decoupling media transcoding via asynchronous event pipelines, we guarantee sub-second initial page render while preparing adaptive HLS streams in the background.

    ### 2. Live Synchronization with Markdown Text
    By listening to active playback timestamps, reader progress can seamlessly highlight the corresponding section of the technical blog, creating an immersive hybrid learning experience.`)
    const [videoAttached, setVideoAttached] = useState(true)
    const [videoName, setVideoName] = useState("distributed-streaming-benchmarks.mp4")
    const [videoSize, setVideoSize] = useState("142.4 MB")
    const [embedUrl, setEmbedUrl] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [currentPostId, setCurrentPostId] = useState(postId || null)
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
    const [attachedVideo, setAttachedVideo] = useState(null)
    const libraryVideos = videosResponse?.data ?? []
    const handleSelectLibraryVideo = (video) => {
      setErrorMessage("")
      setAttachedVideo(video)
      setVideoAttached(true)
      setVideoName(video.title || "Library asset")
      setVideoSize(video.file_size || "—")
      setMediaPickerOpen(false)
      if (currentPostId) {
        updateVideo.mutate(
          { id: video.id, data: { post_id: currentPostId } },
          {
            onError: (err: any) => {
              setErrorMessage(err?.response?.data?.message ?? "Could not attach the video.")
            },
          },
        )
      }
    }
    useEffect(() => {
      if (!existingPost) return
      setTitle(existingPost.title || "")
      setSlug(existingPost.slug || "")
      setCategory(existingPost.category || "Engineering")
      setTags(Array.isArray(existingPost.tags) ? existingPost.tags : [])
      setBodyText(existingPost.content || "")
      setSavedStatus(existingPost.status === "published" ? "Published" : "Draft")
      setCurrentPostId(existingPost.id)
      const attached = (existingPost.videos ?? [])[0]
      if (attached) {
        setVideoAttached(true)
        setVideoName(attached.title || "Attached video")
        setVideoSize(attached.file_size || "—")
      }
    }, [existingPost])
    const handleTitleChange = (val) => {
      setTitle(val)
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    }
    const handleAddTag = (e) => {
      if (e.key === "Enter" && newTag.trim()) {
        e.preventDefault()
        if (!tags.includes(newTag.trim())) {
          setTags([...tags, newTag.trim().toLowerCase()])
        }
        setNewTag("")
      }
    }
    const handleRemoveTag = (tagToRemove) => {
      setTags(tags.filter((t) => t !== tagToRemove))
    }
    const buildPostPayload = () => ({
      title,
      slug,
      category,
      tags,
      content: bodyText,
      status: "draft",
      organization_id: baseOwnerId,
      user_id: user?.id,
    })
    const handleSaveDraft = () => {
      setIsSaving(true)
      setErrorMessage("")
      const onSuccess = (saved) => {
        setIsSaving(false)
        setSavedStatus("Draft Saved")
        setLastSavedTime("a moment ago")
        if (saved && saved.id) setCurrentPostId(saved.id)
      }
      const onError = (err) => {
        setIsSaving(false)
        setErrorMessage(err?.response?.data?.message ?? "Could not save the draft.")
      }
      if (currentPostId) {
        updatePost.mutate({ id: currentPostId, data: buildPostPayload() }, { onSuccess, onError })
      } else {
        createPost.mutate(buildPostPayload(), { onSuccess, onError })
      }
    }
    const handlePublish = () => {
      setIsPublishing(true)
      setErrorMessage("")
      const onSuccess = () => {
        setIsPublishing(false)
        setSavedStatus("Published")
        navigate("/")
      }
      const onError = (err) => {
        setIsPublishing(false)
        setErrorMessage(err?.response?.data?.message ?? "Could not publish the post.")
      }
      const publish = (id) => updatePost.mutate({ id, data: { status: "published" } }, { onSuccess, onError })
      if (currentPostId) {
        publish(currentPostId)
      } else {
        createPost.mutate(
          { ...buildPostPayload(), status: "published" },
          { onSuccess: (saved) => { if (saved && saved.id) publish(saved.id) }, onError },
        )
      }
    }
    const handleSimulateUpload = () => {
      setIsUploading(true)
      setUploadProgress(15)
      window.setTimeout(() => setUploadProgress(45), 200)
      window.setTimeout(() => setUploadProgress(80), 400)
      window.setTimeout(() => {
        setUploadProgress(100)
        setIsUploading(false)
        setVideoAttached(true)
        setVideoName("keynote-screencast-final.mov")
        setVideoSize("215.8 MB")
      }, 650)
    }
    const handleAttachUrl = () => {
      if (!embedUrl) return
      setErrorMessage("")
      const attachedPostId = currentPostId
      createVideo.mutate(
        {
          title: `External Stream: ${embedUrl}`,
          url: embedUrl,
          media_type: "video",
          format: "mp4",
          file_size: "Synced Web Stream",
          status: "ready",
          post_id: attachedPostId,
          organization_id: baseOwnerId,
          user_id: user?.id,
        },
        {
          onSuccess: () => {
            setVideoAttached(true)
            setVideoName("External Stream: " + embedUrl)
            setVideoSize("Synced Web Stream")
            setEmbedUrl("")
          },
          onError: (err: any) => {
            setErrorMessage(err?.response?.data?.message ?? "Could not attach the video.")
          },
        },
      )
    }
    const [isPublic, setIsPublic] = useState(true)
    const [author, setAuthor] = useState(user?.name || "Sarah Chen")
    const [isScheduled, setIsScheduled] = useState(false)
    const [scheduleDate, setScheduleDate] = useState("2025-05-20T09:00")
    const [syncLinkedIn, setSyncLinkedIn] = useState(true)
    const [syncYouTube, setSyncYouTube] = useState(true)
  return (
   <div className="min-h-screen bg-background pb-16 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-3">
      <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate("/")}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      >
      <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
      <div className="flex items-center gap-2">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
      Create & Publish Article
      </h1>
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
      {savedStatus}
      </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
      <Clock className="h-3 w-3" /> Last saved {lastSavedTime} • Autosave active
      </p>
      {errorMessage ? (
      <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      ) : null}
      </div>
      </div>

      <div className="flex items-center gap-2.5">
      <Button
      variant="outline"
      size="sm"
      onClick={handleSaveDraft}
      disabled={isSaving}
      className="text-xs gap-1.5"
      >
      <Save className="h-3.5 w-3.5" />
      <span>{isSaving ? "Saving..." : "Save Draft"}</span>
      </Button>

      <Button
      size="sm"
      onClick={handlePublish}
      disabled={isPublishing}
      className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
      >
      <Send className="h-3.5 w-3.5" />
      <span>{isPublishing ? "Publishing..." : "Publish Post"}</span>
      </Button>

      <DropdownMenu>
      <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="More actions" className="h-9 w-9">
      <MoreHorizontal className="h-4 w-4" />
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
      <DropdownMenuItem onClick={() => setMediaPickerOpen(true)}>
      Insert from Media Library
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleSaveDraft}>
      Export as Markdown
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate("/")} className="text-destructive focus:text-destructive">
      Discard Draft
      </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      </div>
      </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Editor Left Column (8 cols) */}
      <div className="lg:col-span-7 space-y-6">
      <Card className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
      <div className="space-y-2">
      <Label htmlFor="post-title" className="text-sm font-semibold text-foreground">
      Article Title
      </Label>
      <Input
      id="post-title"
      placeholder="e.g. Architecting Distributed Video Blogs for High-Retention Readership"
      value={title}
      onChange={(e) => handleTitleChange(e.target.value)}
      className="text-lg font-semibold h-12"
      />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
      <Label htmlFor="post-slug" className="text-xs font-medium text-muted-foreground">
      URL Slug
      </Label>
      <div className="flex items-center rounded-lg border border-input bg-muted/40 px-3 h-9 text-xs font-mono text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/70 mr-1">/blog/</span>
      <input
      id="post-slug"
      value={slug}
      onChange={(e) => setSlug(e.target.value)}
      className="w-full bg-transparent outline-none text-foreground"
      />
      </div>
      </div>

      <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
      Primary Category
      </Label>
      <Select value={category} onValueChange={setCategory}>
      <SelectTrigger className="h-9 text-xs">
      <SelectValue placeholder="Select Category" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      {categories.map((cat) => (
      <SelectItem key={cat} value={cat}>
      {cat}
      </SelectItem>
      ))}
      </SelectContent>
      </Select>
      </div>
      </div>

      {/* Tags Input */}
      <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">
      Topic Tags
      </Label>
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-input bg-background min-h-10">
      {tags.map((tag) => (
      <Badge key={tag} variant="secondary" className="text-xs gap-1 py-1 px-2.5">
      <span>#{tag}</span>
      <button
      type="button"
      onClick={() => handleRemoveTag(tag)}
      className="hover:text-destructive transition-colors ml-0.5"
      >
      <X className="h-3 w-3" />
      </button>
      </Badge>
      ))}
      <div className="flex items-center gap-1 ml-1 flex-1 min-w-32">
      <input
      placeholder="Type tag & Enter..."
      value={newTag}
      onChange={(e) => setNewTag(e.target.value)}
      onKeyDown={handleAddTag}
      className="text-xs bg-transparent outline-none w-full"
      />
      </div>
      </div>
      </div>

      {/* Body tabs */}
      <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Story Body
      </Label>
      <span className="text-xs text-muted-foreground">
      {bodyText.split(/\s+/).filter(Boolean).length} words
      </span>
      </div>

      <Tabs defaultValue="write" className="w-full">
      <TabsList className="bg-muted/70">
      <TabsTrigger value="write" className="text-xs">Write & Edit</TabsTrigger>
      <TabsTrigger value="preview" className="text-xs">Live Markdown Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="write" className="mt-3">
      <Textarea
      placeholder="Write your article narrative here. Use Markdown for styling, embed codes, and video timestamps..."
      value={bodyText}
      onChange={(e) => setBodyText(e.target.value)}
      className="min-h-[320px] font-mono text-sm leading-relaxed"
      />
      </TabsContent>

      <TabsContent value="preview" className="mt-3">
      <div className="p-4 rounded-xl border border-border bg-muted/20 min-h-[320px] prose prose-sm dark:prose-invert max-w-none text-foreground space-y-4">
      <h2 className="text-xl font-bold">{title || "Untitled Article"}</h2>
      <p className="text-muted-foreground italic">Category: {category}</p>
      {videoAttached ? (
      <div data-testid="preview-embedded-video" className="not-prose rounded-xl border border-border bg-slate-950 overflow-hidden">
      <div className="relative aspect-video flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
      <Play className="h-6 w-6 translate-x-0.5 fill-current" />
      </div>
      <p className="text-white/80 text-sm font-medium line-clamp-1">{videoName}</p>
      <span className="text-xs text-white/50">
      {attachedVideo?.duration || "04:12"} • {videoSize}
      </span>
      </div>
      </div>
      </div>
      ) : null}
      <div className="whitespace-pre-wrap leading-relaxed text-sm">
      {bodyText}
      </div>
      </div>
      </TabsContent>
      </Tabs>
      </div>
      </Card>
      </div>

      {/* Video Integration Right Column (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
      <Card className="rounded-2xl border border-dashed border-primary/40 bg-accent/20 p-6 space-y-5">
      <CardHeader className="p-0 space-y-1">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
      <Video className="h-4 w-4" />
      </div>
      <CardTitle className="text-base font-bold text-foreground">
      Integrated Video Asset
      </CardTitle>
      </div>
      <Badge variant="outline" className="bg-primary/10 text-primary text-[10px]">
      HLS Streaming
      </Badge>
      </div>
      <CardDescription className="text-xs text-muted-foreground">
      Attach or upload a video file for automated CDN transcoding and synchronized player controls.
      </CardDescription>
      </CardHeader>

      {/* Video Attachment Box */}
      {videoAttached ? (
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      <FileVideo className="h-5 w-5" />
      </div>
      <div>
      <p className="text-xs font-semibold text-foreground line-clamp-1">{videoName}</p>
      <p className="text-[11px] text-muted-foreground">{videoSize} • 1080p H.264</p>
      </div>
      </div>
      <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={() => setVideoAttached(false)}
      >
      <X className="h-3.5 w-3.5" />
      </Button>
      </div>

      <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">Transcode & CDN Sync</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
      </div>
      <Progress value={100} className="h-1.5 bg-muted" />
      </div>

      <div className="p-2.5 rounded-lg bg-primary/5 text-xs text-foreground space-y-1">
      <div className="flex items-center gap-1.5 font-medium text-primary text-[11px]">
      <Sparkles className="h-3.5 w-3.5" />
      <span>Smart Chapters Extracted</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
      00:00 Intro • 02:15 Architecture • 05:40 Live Benchmark • 08:20 Conclusion
      </p>
      </div>
      </div>
      ) : (
      <div className="space-y-4">
      <div
      onClick={handleSimulateUpload}
      className="border-2 border-dashed border-primary/30 hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-colors bg-background/50 flex flex-col items-center justify-center space-y-2"
      >
      <UploadCloud className="h-8 w-8 text-primary" />
      <div className="space-y-0.5">
      <p className="text-xs font-semibold text-foreground">
      Click to upload video file
      </p>
      <p className="text-[11px] text-muted-foreground">
      Supports MP4, MOV, WebM (up to 500MB)
      </p>
      </div>
      <Button size="sm" variant="secondary" className="text-xs h-7 mt-1">
      Select Video
      </Button>
      </div>

      <div className="flex items-center gap-2">
      <div className="h-px bg-border flex-1" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or embed URL</span>
      <div className="h-px bg-border flex-1" />
      </div>

      <div className="flex items-center gap-2">
      <div className="relative flex-1">
      <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
      placeholder="https://youtube.com/watch?v=... or Vimeo URL"
      value={embedUrl}
      onChange={(e) => setEmbedUrl(e.target.value)}
      className="pl-8 h-8 text-xs"
      />
      </div>
      <Button size="sm" variant="outline" onClick={handleAttachUrl} className="h-8 text-xs">
      Attach
      </Button>
      </div>
      </div>
      )}

      {isUploading ? (
      <div className="space-y-2 p-3 rounded-xl bg-card border border-border">
      <div className="flex justify-between text-xs font-medium">
      <span>Uploading & Generating Transcodes...</span>
      <span>{uploadProgress}%</span>
      </div>
      <Progress value={uploadProgress} className="h-2" />
      </div>
      ) : null}

      <Alert className="bg-primary/5 border-primary/20 text-xs py-2.5">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <AlertDescription className="text-xs text-muted-foreground ml-2">
      Embedded videos include automated subtitle indexing, improving organic SEO visibility by 40%.
      </AlertDescription>
      </Alert>
      </Card>
      </div>
      </div>
  <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
      <CardHeader className="p-0">
      <div className="flex items-center justify-between">
      <div>
      <CardTitle className="text-lg font-bold text-foreground">
      SEO & Multi-Channel Distribution
      </CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-1">
      Configure discoverability metadata, scheduling, and automatic channel broadcasting.
      </CardDescription>
      </div>
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
      <Sparkles className="h-3 w-3 mr-1" /> SEO Score: 94/100
      </Badge>
      </div>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
      {/* Author & Visibility */}
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
      <div className="flex items-center justify-between">
      <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
      Publishing Scope
      </Label>
      {isPublic ? (
      <Badge className="bg-primary text-primary-foreground text-[10px]">Public</Badge>
      ) : (
      <Badge variant="secondary" className="text-[10px]">Internal Only</Badge>
      )}
      </div>

      <div className="flex items-center justify-between space-x-2">
      <div className="space-y-0.5">
      <Label className="text-xs font-medium text-foreground">Make Globally Visible</Label>
      <p className="text-[11px] text-muted-foreground">Index on Google and public blog feed</p>
      </div>
      <Switch checked={isPublic} onCheckedChange={setIsPublic} />
      </div>

      <div className="space-y-1.5 pt-2">
      <Label className="text-xs text-muted-foreground">Author Attribution</Label>
      <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="h-8 text-xs bg-card" />
      </div>
      </div>

      {/* Scheduling */}
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
      <div className="flex items-center justify-between">
      <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
      Scheduling
      </Label>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex items-center justify-between space-x-2">
      <div className="space-y-0.5">
      <Label className="text-xs font-medium text-foreground">Schedule for Future</Label>
      <p className="text-[11px] text-muted-foreground">Publish automatically on a specific date</p>
      </div>
      <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
      </div>

      {isScheduled ? (
      <div className="space-y-1.5 pt-2 animate-fadeIn">
      <Label className="text-xs text-muted-foreground">Release Date & Time</Label>
      <Input
      type="datetime-local"
      value={scheduleDate}
      onChange={(e) => setScheduleDate(e.target.value)}
      className="h-8 text-xs bg-card"
      />
      </div>
      ) : (
      <p className="text-[11px] text-muted-foreground pt-2">
      Will publish immediately once confirmed by the editorial lead.
      </p>
      )}
      </div>

      {/* Syndication */}
      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
      <div className="flex items-center justify-between">
      <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
      Auto Syndication
      </Label>
      <Share2 className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-3">
      <div className="flex items-center justify-between">
      <div className="space-y-0.5">
      <span className="text-xs font-medium text-foreground block">LinkedIn Newsletter</span>
      <span className="text-[10px] text-muted-foreground">Post summary card</span>
      </div>
      <Switch checked={syncLinkedIn} onCheckedChange={setSyncLinkedIn} />
      </div>

      <div className="flex items-center justify-between">
      <div className="space-y-0.5">
      <span className="text-xs font-medium text-foreground block">YouTube Sync</span>
      <span className="text-[10px] text-muted-foreground">Publish video chapter</span>
      </div>
      <Switch checked={syncYouTube} onCheckedChange={setSyncYouTube} />
      </div>
      </div>
      </div>
      </div>

      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
      Canonical URL: <span className="font-mono text-foreground">https://blog.contentreach.io/architecting-distributed-video-blogs</span>
      </p>
      <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs">
      Cancel
      </Button>
      <Button size="sm" onClick={() => navigate("/")} className="text-xs bg-primary text-primary-foreground gap-1.5 shadow-sm">
      Confirm & Finish Post
      <ArrowRight className="h-3.5 w-3.5" />
      </Button>
      </div>
      </div>
      </Card>
      </div>

      {/* Media library picker — AC-19/AC-20: only the content team reaches the
          editor, and selecting an asset attaches it to the post by setting the
          video's post_id. */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
      <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
      <DialogTitle className="text-lg font-bold text-foreground">Insert from Media Library</DialogTitle>
      <DialogDescription className="text-xs text-muted-foreground">
      Select an uploaded asset to embed in this article.
      </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 max-h-80 overflow-y-auto">
      {libraryVideos.length === 0 ? (
      <p className="text-sm text-muted-foreground py-6 text-center">No media assets yet.</p>
      ) : libraryVideos.map((video) => (
      <button
      key={video.id}
      type="button"
      data-testid={`media-picker-item-${video.id}`}
      onClick={() => handleSelectLibraryVideo(video)}
      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/20 transition-colors flex items-center justify-between gap-3"
      >
      <span className="flex items-center gap-2 min-w-0">
      <FileVideo className="h-4 w-4 text-primary shrink-0" />
      <span className="min-w-0">
      <span className="block text-sm font-medium text-foreground truncate">{video.title}</span>
      <span className="block text-[11px] text-muted-foreground">
      {video.format || "mp4"} • {video.file_size || "—"} • {video.duration || "—"}
      </span>
      </span>
      </span>
      <span className="text-xs font-semibold text-primary shrink-0">Attach</span>
      </button>
      ))}
      </div>
      </DialogContent>
      </Dialog>
    </div>
  );
}