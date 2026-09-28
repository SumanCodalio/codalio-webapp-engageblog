
import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Share2, Sparkles, CheckCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
        export default function VideoPlayerModal({ isOpen, onOpenChange, title = "Video Preview", duration = "03:45", description = "" }: { isOpen: boolean; onOpenChange: (open: boolean) => void; title?: string; duration?: string; description?: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [copied, setCopied] = useState(false)
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl sm:max-w-4xl p-0 overflow-hidden bg-card border-border">
    <div className="relative aspect-video bg-slate-950 flex items-center justify-center group overflow-hidden">
    {/* Visual video backdrop */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none z-10" />

    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
    <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/20">
    {isPlaying ? (
    <div className="flex gap-1.5 items-center">
    <div className="w-2 h-6 bg-primary rounded-full animate-pulse" />
    <div className="w-2 h-8 bg-primary rounded-full animate-pulse delay-75" />
    <div className="w-2 h-5 bg-primary rounded-full animate-pulse delay-150" />
    </div>
    ) : (
    <Play className="h-9 w-9 translate-x-0.5 fill-current" />
    )}
    </div>
    <p className="text-white/80 font-medium text-sm max-w-md line-clamp-1">{title}</p>
    <span className="text-xs text-white/50 mt-1">{duration} • 1080p Full HD</span>
    </div>

    {/* Video controls bar overlay */}
    <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col gap-2">
    <div className="w-full">
    <Progress value={isPlaying ? 45 : 12} className="h-1.5 bg-white/20 cursor-pointer" />
    </div>
    <div className="flex items-center justify-between text-white text-xs">
    <div className="flex items-center gap-2">
    <Button
    size="icon"
    variant="ghost"
    className="h-8 w-8 text-white hover:bg-white/20"
    onClick={() => setIsPlaying(!isPlaying)}
    >
    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
    </Button>
    <Button
    size="icon"
    variant="ghost"
    className="h-8 w-8 text-white hover:bg-white/20"
    onClick={() => setIsMuted(!isMuted)}
    >
    {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
    </Button>
    <span className="font-mono text-[11px] text-white/80">01:42 / {duration}</span>
    </div>

    <div className="flex items-center gap-2">
    <Badge variant="outline" className="text-[10px] border-white/20 text-white/90 bg-white/10">
    Auto Transcoded
    </Badge>
    <Button
    size="icon"
    variant="ghost"
    className="h-8 w-8 text-white hover:bg-white/20"
    onClick={() => setCopied(true)}
    >
    {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
    </Button>
    <Button
    size="icon"
    variant="ghost"
    className="h-8 w-8 text-white hover:bg-white/20"
    >
    <Maximize2 className="h-4 w-4" />
    </Button>
    </div>
    </div>
    </div>
    </div>

    <div className="p-6 space-y-4">
    <DialogHeader>
    <div className="flex items-center justify-between gap-4">
    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
    <Badge className="bg-primary/10 text-primary border-primary/20">Ready to Publish</Badge>
    </div>
    <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
    {description || "High definition video asset with automated captioning, chapter markers, and social clips ready for distribution."}
    </DialogDescription>
    </DialogHeader>

    <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
    <Sparkles className="h-4 w-4 text-primary" />
    <span>AI summaries & auto-chapters generated</span>
    </div>
    <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
    Close
    </Button>
    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
    Insert into Post
    </Button>
    </div>
    </div>
    </div>
    </DialogContent>
    </Dialog>
        );
        }