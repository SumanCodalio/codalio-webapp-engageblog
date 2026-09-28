
        import React from "react"
import { CheckCircle2, Clock, FileEdit, AlertCircle, Archive } from "lucide-react";
import { Badge } from "./ui/badge";
        export default function ContentStatusBadge({ status, label, className = "" }: { status: string; label?: string; className?: string }) {
  const normalized = status.toLowerCase()
  let colorClass = "bg-muted/70 text-muted-foreground border-border"
  let icon: React.ReactNode = null

  if (normalized === "published" || normalized === "active" || normalized === "operational" || normalized === "healthy") {
  colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
  icon = <CheckCircle2 className="h-3 w-3" />
  } else if (normalized === "scheduled" || normalized === "pending" || normalized === "in progress") {
  colorClass = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
  icon = <Clock className="h-3 w-3" />
  } else if (normalized === "draft" || normalized === "review") {
  colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
  icon = <FileEdit className="h-3 w-3" />
  } else if (normalized === "archived" || normalized === "inactive") {
  colorClass = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30"
  icon = <Archive className="h-3 w-3" />
  } else if (normalized === "error" || normalized === "degraded" || normalized === "revoked") {
  colorClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
  icon = <AlertCircle className="h-3 w-3" />
  }
        return (
            <Badge variant="outline" className={`font-medium px-2.5 py-0.5 text-xs inline-flex items-center gap-1.5 rounded-full ${colorClass} ${className}`}>
    {icon}
    <span>{label || status}</span>
    </Badge>
        );
        }