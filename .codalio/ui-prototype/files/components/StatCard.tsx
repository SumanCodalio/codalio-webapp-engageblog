
        import React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
        export default function StatCard({ title, label, value, change, trend = "neutral", icon, description, className = "" }: { title?: string; label?: string; value: string | number; change?: string; trend?: "up" | "down" | "neutral"; icon?: React.ReactNode; description?: string; className?: string }) {
        return (
            <Card className={`border border-border/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
    <CardTitle className="text-sm font-medium text-muted-foreground">{title || label}</CardTitle>
    {icon && (
    <div className="p-2 rounded-lg bg-primary/10 text-primary">
    {icon}
    </div>
    )}
    </CardHeader>
    <CardContent>
    <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
    {(change || description) && (
    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
    {change && (
    <Badge
    variant="secondary"
    className={`font-semibold px-1.5 py-0.5 text-xs flex items-center gap-1 ${
    trend === "up"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    : trend === "down"
    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800"
    : "bg-muted text-muted-foreground"
    }`}
    >
    {trend === "up" && <TrendingUp className="h-3 w-3" />}
    {trend === "down" && <TrendingDown className="h-3 w-3" />}
    {trend === "neutral" && <Minus className="h-3 w-3" />}
    {change}
    </Badge>
    )}
    {description && <span>{description}</span>}
    </div>
    )}
    </CardContent>
    </Card>
        );
        }