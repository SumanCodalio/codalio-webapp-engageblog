import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContentStatusBadge from "@/components/shared/ContentStatusBadge";

import { Activity, ArrowLeft, Database, Download, FileSpreadsheet, HardDrive, MoreVertical, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, useModelDelete, useModelIndex, useModelStore } from "@rhino-dev/rhino-react";
import { useBaseOwnerId } from "@/codalio/session";

const REPORT_TYPES = [
  "All Reports",
  "Reach & Performance",
  "System Health & Uptime",
  "Audit Logs",
  "Media CDN Bandwidth",
];

const REPORT_TYPE_VALUES: Record<string, string> = {
  "Reach & Performance": "performance",
  "System Health & Uptime": "health",
  "Audit Logs": "security_audit",
  "Media CDN Bandwidth": "bandwidth",
};

export default function AdminSystemReports() {
  const navigate = useNavigate();
  const baseOwnerId = useBaseOwnerId();
  const [reportType, setReportType] = useState("All Reports");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [newReportType, setNewReportType] = useState("performance");
  const [auditFilter, setAuditFilter] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");

  const { data: reportsResponse, isLoading } = useModelIndex("system_reports", {
    sort: "-generated_at",
  });
  const { data: health, refetch, isFetching } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => (await api.get("/system/health")).data,
  });

  const createReport = useModelStore("system_reports");
  const deleteReport = useModelDelete("system_reports");

  const reports = (reportsResponse?.data ?? []).filter((report: any) => {
    if (reportType === "All Reports") return true;
    return report.report_type === REPORT_TYPE_VALUES[reportType];
  });

  const handleGenerateReport = () => {
    setErrorMessage("");
    createReport.mutate(
      {
        report_type: newReportType,
        parameters: { range: "30d" },
        status: "ready",
        organization_id: baseOwnerId,
      },
      {
        onSuccess: () => setGenerateOpen(false),
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not generate the report."),
      },
    );
  };

  const handleDeleteReport = (id: number) => {
    setErrorMessage("");
    deleteReport.mutate(id, {
      onError: (err: any) =>
        setErrorMessage(err?.response?.data?.message ?? "Could not delete the report."),
    });
  };

  const handleDownloadReport = (report: any) => {
    const summary = report.summary ?? {};
    const csv = Object.entries(summary)
      .map(([key, value]) => `"${key}","${String(value).replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contentreach-${report.report_type ?? "report"}-${report.id}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "codalio-regenerate-page",
          pageName: "AdminSystemReports",
          prompt: `Please regenerate the page "AdminSystemReports". The previous generation failed to produce code. Make sure to generate all sections for this page.`,
        },
        "*",
      );
    }
  };

  const handleRestore = async () => {
    setErrorMessage("");
    setRestoreMessage("");
    try {
      const response = await api.post("/system/restore");
      setRestoreMessage(response.data?.message ?? "Restore initiated.");
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message ?? "Could not initiate the restore.");
    }
  };

  const healthTiles = [
    {
      label: "Platform Uptime",
      value: health?.api_gateway?.value ?? "—",
      change: health?.api_gateway?.detail ?? "",
      status: health?.api_gateway?.status ?? "—",
      icon: Wifi,
    },
    {
      label: "API Response Time",
      value: health?.db_replica?.status ?? "—",
      change: health?.db_replica?.detail ?? "",
      status: health?.db_replica?.value ?? "—",
      icon: Database,
    },
    {
      label: "Video CDN Egress",
      value: health?.video_storage?.value ?? "—",
      change: health?.video_storage?.status ?? "",
      status: health?.video_storage?.detail ?? "—",
      icon: HardDrive,
    },
    {
      label: "Security Perimeter",
      value: health?.security_perimeter?.value ?? "—",
      change: health?.security_perimeter?.detail ?? "",
      status: health?.security_perimeter?.status ?? "—",
      icon: ShieldCheck,
    },
  ];

  const auditLogs = reports
    .filter((report: any) => report.report_type === "security_audit")
    .filter((report: any) =>
      auditFilter
        ? JSON.stringify(report).toLowerCase().includes(auditFilter.toLowerCase())
        : true,
    );

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
                  System Health & Reports
                </h1>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {reports.length} Reports
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit compliance logs, transcode queue throughput, bandwidth usage metrics, and scheduled reporting archives.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48 h-9 text-xs">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Generate Report</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-lg">Generate System Report</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Select the report type and parameters to compile a new archive entry.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Report Type</Label>
                    <Select value={newReportType} onValueChange={setNewReportType}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
                        <SelectItem value="performance">Reach & Performance</SelectItem>
                        <SelectItem value="health">System Health & Uptime</SelectItem>
                        <SelectItem value="security_audit">Audit Logs</SelectItem>
                        <SelectItem value="bandwidth">Media CDN Bandwidth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" size="sm" onClick={() => setGenerateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerateReport}
                    disabled={createReport.isPending}
                    className="bg-primary text-primary-foreground"
                  >
                    {createReport.isPending ? "Generating..." : "Generate Report"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        {restoreMessage ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{restoreMessage}</p> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthTiles.map((tile) => (
            <Card key={tile.label} className="bg-card border border-border rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{tile.label}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <tile.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold tracking-tight text-foreground">{tile.value}</div>
                <p className="text-[11px] text-muted-foreground">{tile.change}</p>
                <ContentStatusBadge status={tile.status} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="w-full bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Generated Reports & Export Archive</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Scheduled and on-demand reports available for download and compliance review.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>{isFetching ? "Polling..." : "Check Status"}</span>
            </Button>
          </div>

          <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Report Type</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-40 text-right">Generated</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                      Loading reports…
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-background text-foreground">
                        <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center shadow-sm space-y-6">
                          <div className="space-y-2">
                            <h1 className="text-2xl font-semibold">Page Not Generated</h1>
                            <p className="text-muted-foreground text-sm">
                              The page "AdminSystemReports" could not be generated. This may be due to an error during the generation process.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            onClick={handleRegenerate}
                          >
                            Try Regenerating
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report: any) => (
                    <TableRow key={report.id} className="hover:bg-muted/30">
                      <TableCell>
                        <p className="font-semibold text-sm text-foreground capitalize">
                          {(report.report_type ?? "report").replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {report.summary ? JSON.stringify(report.summary) : "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <ContentStatusBadge status={report.status ?? "pending"} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {report.generated_at
                          ? new Date(report.generated_at).toLocaleString("en-US")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                            <DropdownMenuItem onClick={() => handleDownloadReport(report)}>
                              <Download className="h-3.5 w-3.5 mr-2" /> Download Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Report
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

        <Card className="w-full bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Security & Operational Audit Logs
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Compliance events, blocked access attempts, and operational audit entries.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter audit logs..."
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                className="text-xs h-9 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore from Backup</span>
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Audit Entry</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-40 text-right">Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground text-sm">
                      No audit log entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell>
                        <p className="font-semibold text-sm text-foreground capitalize">
                          {(log.report_type ?? "audit").replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {log.summary ? JSON.stringify(log.summary) : "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <ContentStatusBadge status={log.status ?? "pending"} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {log.generated_at ? new Date(log.generated_at).toLocaleString("en-US") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
