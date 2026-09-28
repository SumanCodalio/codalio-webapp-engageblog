import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentStatusBadge from "@/components/shared/ContentStatusBadge";
import StatCard from "@/components/shared/StatCard";
import VideoPlayerModal from "@/components/shared/VideoPlayerModal";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  MoreVertical,
  Play,
  Plus,
  Search,
  Sparkles,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Video,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, useModelDelete, useModelIndex, useModelUpdate } from "@rhino-dev/rhino-react";
import { useUser } from "@/codalio/session";

function formatCount(value?: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Landing() {
  const navigate = useNavigate();
  const user = useUser();
  const [dateRange, setDateRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("Total Content Reach");

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary", dateRange],
    queryFn: async () =>
      (await api.get("/analytics/summary", { params: { range: dateRange } })).data,
  });

  const { data: postsResponse, isLoading: postsLoading } = useModelIndex("posts", {
    sort: "-created_at",
    includes: ["videos"],
  });

  const updatePost = useModelUpdate("posts");
  const deletePost = useModelDelete("posts");
  const [errorMessage, setErrorMessage] = useState("");

  const metrics = [
    {
      label: "Total Content Reach",
      value: formatCount(summary?.total_impressions),
      change: "+18.4%",
      trend: "up",
      description: "vs last month",
      icon: Eye,
    },
    {
      label: "Video Watch Hours",
      value: `${summary?.watch_time_hours ?? 0} hrs`,
      change: "+32.1%",
      trend: "up",
      description: "across video posts",
      icon: Clock,
    },
    {
      label: "Avg. Read Completion",
      value: `${summary?.engagement_rate ?? 0}%`,
      change: "+4.2%",
      trend: "up",
      description: "engagement rate",
      icon: BookOpen,
    },
    {
      label: "Published Stories",
      value: formatCount(
        (postsResponse?.data ?? []).filter((p: any) => p.status === "published").length,
      ),
      change: `${(postsResponse?.data ?? []).length} total`,
      trend: "neutral",
      description: `${(postsResponse?.data ?? []).filter((p: any) => p.has_video).length} with embedded video`,
      icon: Layers,
    },
  ];

  const [activeTab, setActiveTab] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const posts = (postsResponse?.data ?? []).map((post: any) => {
    const videos = post.videos ?? [];
    return {
      id: post.id,
      title: post.title ?? "Untitled",
      category: post.category ?? "General",
      readTime: `${post.read_time_minutes ?? 0} min read`,
      hasVideo: Boolean(post.has_video),
      videoDuration: videos[0]?.duration ?? "",
      status: post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : "Draft",
      views: post.view_count ? formatCount(post.view_count) : "—",
      date: post.published_at ? formatDate(post.published_at) : `Draft (${formatDate(post.created_at)})`,
    };
  });

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      post.category.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "published") return post.status === "Published";
    if (activeTab === "draft") return post.status === "Draft";
    if (activeTab === "video") return post.hasVideo;
    return true;
  });

  const handleToggleSelect = (id: number) => {
    if (selectedPostIds.includes(id)) {
      setSelectedPostIds(selectedPostIds.filter((pId) => pId !== id));
    } else {
      setSelectedPostIds([...selectedPostIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPostIds.length === filteredPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredPosts.map((p) => p.id));
    }
  };

  const handleDeletePost = (id: number) => {
    setErrorMessage("");
    deletePost.mutate(id, {
      onError: (err: any) =>
        setErrorMessage(err?.response?.data?.message ?? "Could not delete the post."),
    });
    setSelectedPostIds(selectedPostIds.filter((pId) => pId !== id));
  };

  const handleBatchDelete = () => {
    setErrorMessage("");
    selectedPostIds.forEach((id) => {
      deletePost.mutate(id, {
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not delete the selected posts."),
      });
    });
    setSelectedPostIds([]);
  };

  const handleBatchPublish = () => {
    setErrorMessage("");
    selectedPostIds.forEach((id) => {
      updatePost.mutate(
        { id, data: { status: "published" } },
        {
          onError: (err: any) =>
            setErrorMessage(err?.response?.data?.message ?? "Could not publish the selected posts."),
        },
      );
    });
    setSelectedPostIds([]);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const referralChannels = [
    { name: "Direct Blog Readers", share: "48%", percent: 48, views: "8.8K", growth: "+14%" },
    { name: "YouTube Synced Embeds", share: "32%", percent: 32, views: "5.9K", growth: "+29%" },
    { name: "LinkedIn Video Teasers", share: "14%", percent: 14, views: "2.6K", growth: "+8%" },
    { name: "Email Newsletters", share: "6%", percent: 6, views: "1.1K", growth: "+18%" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-8 w-full min-w-0">
        <Card className="bg-gradient-to-r from-primary/10 via-card to-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 text-xs font-semibold">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Audience Pulse Active
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Updated 5m ago
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Welcome back, {user?.first_name || user?.name || "there"}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Track reach, publish high-impact video blogs, and accelerate audience growth across multi-channel distribution channels.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36 sm:w-40 bg-card">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last Quarter</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => navigate("/create-post")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                <span>Quick Publish</span>
                <ArrowUpRight className="h-4 w-4 opacity-70" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              data-testid={`dashboard-metric-${metric.label}`}
              onClick={() => setSelectedMetric(metric.label)}
              className="cursor-pointer transition-transform duration-150 active:scale-[0.99]"
            >
              <StatCard
                label={metric.label}
                value={metric.value}
                change={metric.change}
                trend={metric.trend as "up" | "down" | "neutral"}
                icon={<metric.icon className="h-5 w-5" />}
                description={metric.description}
                className={selectedMetric === metric.label ? "ring-2 ring-primary border-transparent" : ""}
              />
            </div>
          ))}
        </div>

        <Card className="w-full bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Recent Content & Video Posts</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Manage your published articles, transcode status, and audience reach stats.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/media-library")}
                className="text-xs"
              >
                Browse Media
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/create-post")}
                className="text-xs bg-primary text-primary-foreground gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Post
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-muted/70">
                <TabsTrigger value="all" className="text-xs">All Content ({posts.length})</TabsTrigger>
                <TabsTrigger value="published" className="text-xs">Published</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs">Drafts</TabsTrigger>
                <TabsTrigger value="video" className="text-xs">With Video</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full sm:w-72">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter stories..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Batch Actions Bar */}
          {selectedPostIds.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between text-xs animate-fadeIn">
              <span className="font-medium text-primary">
                {selectedPostIds.length} item(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs bg-card" onClick={handleBatchPublish}>
                  Mark as Published
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBatchDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {errorMessage ? (
            <p className="text-xs text-destructive">{errorMessage}</p>
          ) : null}

          {/* Posts Table */}
          <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Post Title & Category</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-28 text-right">Reach / Views</TableHead>
                  <TableHead className="w-32 text-right">Published Date</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      No matching content found. Try altering your filter or search query.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id} data-testid={`dashboard-post-row-${post.id}`} className="hover:bg-muted/30">
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedPostIds.includes(post.id)}
                          onCheckedChange={() => handleToggleSelect(post.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground flex items-center gap-2">
                          <span className="truncate max-w-md">{post.title}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="text-primary font-medium">{post.category}</span>
                          <span>•</span>
                          <span>{post.readTime}</span>
                          {post.hasVideo && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] flex items-center gap-1">
                                <Video className="h-3 w-3" /> {post.videoDuration}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.hasVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Video className="h-3 w-3" /> Video Story
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            <FileText className="h-3 w-3" /> Article
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContentStatusBadge status={post.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {post.views}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {post.date}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                            <DropdownMenuItem onClick={() => navigate("/create-post")}>
                              <Edit className="h-3.5 w-3.5 mr-2" /> Edit Article
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/analytics")}>
                              <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Reach Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeletePost(post.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Spotlight Card */}
          <Card className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Featured Video Story
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Duration: 12:40</span>
              </div>
              <CardTitle className="text-xl font-bold mt-2 text-foreground">
                Q3 Product Keynote & Developer Walkthrough
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Embedded in the flagship announcement blog with synchronized chapters and code snippets.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Video Preview Banner */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="relative group cursor-pointer aspect-video sm:h-64 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-border"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                {/* Glow and wave decorative background */}
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />

                <div className="relative z-10 flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
                    <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-white tracking-wide uppercase">Click to preview interactive player</span>
                  <span className="text-[11px] text-white/70">4K Ultra HD • Subtitles En/Es • 14 Chapters</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs z-10">
                  <Badge className="bg-black/60 text-white text-[10px] border-none">Transcoded HLS</Badge>
                  <span className="font-mono text-[11px]">89% Avg. Completion</span>
                </div>
              </div>

              {/* Video Retention Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    Audience Retention Curve
                  </span>
                  <span className="font-semibold text-foreground">78.4% watched past 5m mark</span>
                </div>
                <Progress value={78} className="h-2 bg-muted" />
              </div>
            </CardContent>

            <div className="p-6 pt-0 flex flex-wrap items-center justify-between gap-3 border-t border-border mt-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-primary" /> 18,400 plays
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-sky-500" /> 1,240 hrs
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" /> 98.2% positive
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs"
                >
                  Open Player
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/analytics")}
                  className="text-xs bg-primary text-primary-foreground gap-1"
                >
                  Full Analytics
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Audience Channels Breakdown */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Top Distribution Channels</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Where viewers engage with your video blogs the most.
                </CardDescription>
              </div>

              <div className="space-y-4">
                {referralChannels.map((ch) => (
                  <div key={ch.name} className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{ch.name}</span>
                      <span className="font-bold text-primary">{ch.share}</span>
                    </div>
                    <Progress value={ch.percent} className="h-1.5 bg-muted" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{ch.views} impressions</span>
                      <span>{ch.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/admin/api-integrations")}
                className="w-full text-xs text-primary hover:text-primary hover:bg-primary/10 justify-between"
              >
                <span>Manage Video API Connections</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>

          {/* Video Player Modal */}
          <VideoPlayerModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Q3 Product Keynote & Developer Walkthrough"
            duration="12:40"
            description="A comprehensive technical breakdown of our new distributed publishing architecture and high-performance video CDN."
          />
        </div>
      </div>
    </div>
  );
}
