import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/shared/StatCard";
import {
  Download,
  ExternalLink,
  Eye,
  Clock,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@rhino-dev/rhino-react";

function formatCount(value?: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export default function Analytics() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");
  const [contentType, setContentType] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary", range, contentType],
    queryFn: async () =>
      (await api.get("/analytics/summary", { params: { range, content_type: contentType } })).data,
  });

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage("");
    try {
      const response = await api.get("/analytics/summary", {
        params: { range, content_type: contentType, format: "csv" },
      });
      const payload = response.data;
      const rows = Array.isArray(payload) ? payload : (payload?.leaderboard ?? []);
      const csv = rows
        .map((row: any) =>
          [row.title ?? row.label ?? "", row.category ?? "", row.view_count ?? row.views ?? ""]
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contentreach-analytics-${range}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message ?? "Could not export analytics data.");
    } finally {
      setIsExporting(false);
    }
  };

  const cards = [
    {
      label: "Total Impressions",
      value: formatCount(summary?.total_impressions),
      change: "+24.8%",
      detail: "vs previous period",
      icon: Eye,
    },
    {
      label: "Audience Watch Time",
      value: `${summary?.watch_time_hours ?? 0} hrs`,
      change: "+14.2%",
      detail: "3.2 mins avg per session",
      icon: Clock,
    },
    {
      label: "Engagement Rate",
      value: `${summary?.engagement_rate ?? 0}%`,
      change: "+8.5%",
      detail: "4.8% video conversion",
      icon: TrendingUp,
    },
    {
      label: "Unique Readers",
      value: formatCount(summary?.unique_readers),
      change: "+31.0%",
      detail: "Organic search & social",
      icon: Users,
    },
  ];

  const [interval, setInterval] = useState("daily");
  const [activeDay, setActiveDay] = useState("Fri");
  const dailySeries = summary?.daily_series ?? [];
  const maxImpressions = Math.max(1, ...dailySeries.map((d: any) => d.impressions ?? 0));
  const chartBars = dailySeries.map((d: any) => {
    const date = new Date(d.date);
    const day = Number.isNaN(date.getTime())
      ? String(d.date)
      : date.toLocaleDateString("en-US", { weekday: "short" });
    const height = Math.round(((d.impressions ?? 0) / maxImpressions) * 100);
    return { day, readersHeight: height, videoHeight: Math.round(height * 0.7), reach: formatCount(d.impressions) };
  });

  const [searchQuery, setSearchQuery] = useState("");
  const leaderboard = (summary?.leaderboard ?? []).map((item: any) => ({
    id: item.id,
    title: item.title ?? "Untitled",
    category: item.category ?? "General",
    hasVideo: Boolean(item.has_video),
    views: formatCount(item.view_count ?? item.impressions),
    watchTime: item.watch_time ?? "—",
    completion: item.completion ?? "—",
    shares: item.shares ?? "—",
  }));

  const filteredLeaderboard = leaderboard.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-12 w-full min-w-0 overflow-x-hidden">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 bg-card rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Reach & Audience Intelligence
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time telemetry on reader engagement, video watch hours, and viral conversion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-36 h-9 text-xs bg-background">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-36 h-9 text-xs bg-background">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="video">Video Stories</SelectItem>
                <SelectItem value="articles">Written Posts</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-9 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              change={card.change}
              trend="up"
              description={card.detail}
              icon={<card.icon className="h-5 w-5" />}
            />
          ))}
        </div>

        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Audience Reach Trends Chart (7 cols) */}
          <Card className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Audience Reach & Growth Over Time
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Daily active reader volume and video stream initializations.
                </CardDescription>
              </div>

              <Tabs value={interval} onValueChange={setInterval} className="w-auto">
                <TabsList className="bg-muted/70 h-8">
                  <TabsTrigger value="daily" className="text-xs px-2.5">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs px-2.5">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-2.5">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Interactive Bar Visualization */}
            <div data-testid="analytics-daily-chart" className="pt-4 space-y-3">
              <div className="h-52 flex items-end justify-between gap-2 pt-6 px-2 border-b border-border">
                {chartBars.map((bar) => {
                  const isHovered = activeDay === bar.day;
                  return (
                    <div
                      key={bar.day}
                      data-testid="analytics-chart-bar"
                      onMouseEnter={() => setActiveDay(bar.day)}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                    >
                      {isHovered && (
                        <div className="absolute -top-10 bg-popover text-popover-foreground border border-border text-[11px] font-semibold py-1 px-2 rounded shadow-md z-10 whitespace-nowrap">
                          {bar.reach} readers
                        </div>
                      )}
                      <div className="w-full max-w-8 flex items-end gap-1 h-44 justify-center">
                        <div
                          style={{ height: `${bar.readersHeight}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isHovered ? "bg-primary" : "bg-primary/80 group-hover:bg-primary"
                          }`}
                        />
                        <div
                          style={{ height: `${bar.videoHeight}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isHovered ? "bg-indigo-400" : "bg-indigo-400/50 group-hover:bg-indigo-400"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{bar.day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-xs bg-primary" />
                    <span>Article Readers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-xs bg-indigo-400" />
                    <span>Video Stream Starts</span>
                  </div>
                </div>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> +18.6% week-over-week
                </span>
              </div>
            </div>
          </Card>

          {/* Video Retention Analytics (5 cols) */}
          <Card className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground">
                  Video Retention Analytics
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  HLS Insights
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Viewer drop-off timestamps across all embedded video tutorials.
              </CardDescription>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Avg Completion</span>
                <p className="text-2xl font-bold text-foreground">72.4%</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Top 5% in tech blogs</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Peak Watch Point</span>
                <p className="text-2xl font-bold text-foreground">02:14</p>
                <span className="text-[10px] text-muted-foreground">Key architectural demo</span>
              </div>
            </div>

            {/* Step Retention Milestones */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">First 30 Seconds (Hook)</span>
                  <span className="text-primary font-bold">94%</span>
                </div>
                <Progress value={94} className="h-2 bg-muted" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">Mid-point (Technical Code Walk)</span>
                  <span className="text-primary font-bold">78%</span>
                </div>
                <Progress value={78} className="h-2 bg-muted" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">Closing CTA & Next Steps</span>
                  <span className="text-primary font-bold">64%</span>
                </div>
                <Progress value={64} className="h-2 bg-muted" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>Videos with auto-generated chapters experience 3.4x higher end-to-end watch rates.</span>
            </div>
          </Card>
        </div>

        <Card className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-xl font-bold text-foreground">
                  Top Performing Content Leaderboard
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Rankings based on combined reader reach, video watch duration, and completion rates.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search leaderboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Content Title</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-28 text-right">Unique Views</TableHead>
                  <TableHead className="w-28 text-right">Watch Time</TableHead>
                  <TableHead className="w-32 text-right">Completion Rate</TableHead>
                  <TableHead className="w-28 text-right">Shares</TableHead>
                  <TableHead className="w-20 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaderboard.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-center font-bold text-xs">
                      {index === 0 && <span className="inline-block w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 leading-5">1</span>}
                      {index === 1 && <span className="inline-block w-5 h-5 rounded-full bg-slate-300/40 text-slate-700 dark:text-slate-300 leading-5">2</span>}
                      {index === 2 && <span className="inline-block w-5 h-5 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 leading-5">3</span>}
                      {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/create-post/${item.id}`)}>
                        {item.title}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                    </TableCell>
                    <TableCell>
                      {item.hasVideo ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] gap-1">
                          <Video className="h-3 w-3" /> Video
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] gap-1">
                          <FileText className="h-3 w-3" /> Text
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {item.views}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                      {item.watchTime}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {item.completion}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {item.shares}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/create-post/${item.id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
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
  );
}
