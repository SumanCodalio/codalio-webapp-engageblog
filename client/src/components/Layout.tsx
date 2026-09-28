import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, PenTool, Film, BarChart3, ShieldCheck, Users, Plug, Sliders, FileSpreadsheet, LogOut, Bell, Search, ChevronRight, Menu, Sparkles, Layers } from "lucide-react";
import { useAuth } from "@rhino-dev/rhino-react";
import { useUserRole } from "@/codalio/useUserRole";

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, hasRole } = useUserRole()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Create Post", path: "/create-post", icon: PenTool, badge: "AI" },
  { label: "Media Library", path: "/media-library", icon: Film },
  { label: "Reach & Analytics", path: "/analytics", icon: BarChart3 },
  ]

  const adminItems = [
  { label: "Admin Overview", path: "/admin", icon: ShieldCheck },
  { label: "Team & Roles", path: "/admin/users", icon: Users },
  { label: "Integrations & APIs", path: "/admin/api-integrations", icon: Plug },
  { label: "System Settings", path: "/admin/system-settings", icon: Sliders },
  { label: "Health & Reports", path: "/admin/system-reports", icon: FileSpreadsheet },
  ]

  const isAdmin = hasRole("admin")
  const visibleAdminItems = isAdmin ? adminItems : []
  const displayName = user?.name || user?.email || "Signed in"
  const initials = (user?.name || user?.email || "CR")
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }
        return (
            <div className="min-h-screen bg-background text-foreground flex">
    {/* Desktop Sidebar */}
    <aside
    className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${
    collapsed ? "w-20" : "w-64"
    } shrink-0 sticky top-0 h-screen z-30`}
    >
    {/* Sidebar Brand */}
    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
    {!collapsed ? (
    <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/30">
    <Layers className="h-5 w-5" />
    </div>
    <div className="flex flex-col">
    <span className="leading-tight text-foreground font-semibold">ContentReach</span>
    <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">Blog & Video Suite</span>
    </div>
    </Link>
    ) : (
    <Link to="/" className="mx-auto">
    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
    <Layers className="h-5 w-5" />
    </div>
    </Link>
    )}
    <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex"
    onClick={() => setCollapsed(!collapsed)}
    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
    </Button>
    </div>

    {/* Primary Navigation Links */}
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
    <div className="space-y-1">
    {!collapsed && (
    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
    Publishing
    </p>
    )}
    {navItems.map((item) => (
    <Link
    key={item.path}
    to={item.path}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    location.pathname === item.path
    ? "bg-primary text-primary-foreground shadow-sm"
    : "text-muted-foreground hover:bg-muted hover:text-foreground"
    } ${collapsed ? "justify-center px-2" : ""}`}
    title={collapsed ? item.label : undefined}
    >
    <item.icon className="h-4 w-4 shrink-0" />
    {!collapsed && <span>{item.label}</span>}
    {!collapsed && item.badge && (
    <Badge
    variant="outline"
    className={`ml-auto text-[10px] px-1.5 py-0 ${
    location.pathname === item.path
    ? "bg-white/20 text-white border-transparent"
    : "bg-primary/10 text-primary border-transparent"
    }`}
    >
    {item.badge}
    </Badge>
    )}
    </Link>
    ))}
    </div>

    {visibleAdminItems.length > 0 && (
    <div className="space-y-1">
    {!collapsed && (
    <div className="flex items-center justify-between px-3">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
    Admin & Governance
    </p>
    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    )}
    {visibleAdminItems.map((adm) => (
    <Link
    key={adm.path}
    to={adm.path}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    location.pathname === adm.path
    ? "bg-primary text-primary-foreground shadow-sm"
    : "text-muted-foreground hover:bg-muted hover:text-foreground"
    } ${collapsed ? "justify-center px-2" : ""}`}
    title={collapsed ? adm.label : undefined}
    >
    <adm.icon className="h-4 w-4 shrink-0" />
    {!collapsed && <span className="truncate">{adm.label}</span>}
    </Link>
    ))}
    </div>
    )}
    </div>

    {/* Quick Action & User Footprint */}
    <div className="p-3 border-t border-border space-y-3">
    {!collapsed ? (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
    <Sparkles className="h-3.5 w-3.5" />
    <span>AI Reach Optimizer</span>
    </div>
    <p className="text-[11px] text-muted-foreground leading-relaxed">
    Boost video impressions by 28% with automated snippet tagging.
    </p>
    <Button
    size="sm"
    variant="outline"
    className="w-full text-xs h-7 border-primary/20 hover:bg-primary/10 text-primary"
    onClick={() => navigate("/create-post")}
    >
    Create New Post
    </Button>
    </div>
    ) : null}

    <div className="flex items-center gap-3 px-1 py-1">
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <button className="flex items-center gap-3 w-full p-1 rounded-lg hover:bg-muted/70 transition-colors text-left">
    <Avatar className="h-9 w-9 border border-border">
    <AvatarImage src={user?.avatar_url} alt={displayName} />
    <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
    </Avatar>
    {!collapsed && (
    <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
    <p className="text-xs text-muted-foreground truncate">{user?.email || "Signed in"}</p>
    </div>
    )}
    </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 bg-popover text-popover-foreground">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => navigate("/admin/users")}>
    <Users className="h-4 w-4 mr-2" /> Team Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate("/admin/system-settings")}>
    <Sliders className="h-4 w-4 mr-2" /> Preferences
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
    <LogOut className="h-4 w-4 mr-2" /> Switch User / Log Out
    </DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>
    </div>
    </div>
    </aside>

    {/* Main Content Area */}
    <div className="flex-1 flex flex-col min-w-0 min-h-screen">
    {/* Top Header */}
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
    {/* Mobile menu trigger */}
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
    <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
    <Menu className="h-5 w-5" />
    </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-72 p-0 bg-card">
    <div className="p-4 border-b border-border flex items-center justify-between">
    <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
    CR
    </div>
    <span className="font-bold text-foreground">ContentReach</span>
    </div>
    </div>
    <div className="p-3 space-y-6">
    <div className="space-y-1">
    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
    Publishing
    </p>
    {navItems.map((mItem) => (
    <Link
    key={mItem.path}
    to={mItem.path}
    onClick={() => setMobileMenuOpen(false)}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
    location.pathname === mItem.path
    ? "bg-primary text-primary-foreground"
    : "text-muted-foreground hover:bg-muted"
    }`}
    >
    <mItem.icon className="h-4 w-4 shrink-0" />
    <span>{mItem.label}</span>
    </Link>
    ))}
    </div>

    {visibleAdminItems.length > 0 && (
    <div className="space-y-1">
    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
    Admin & Governance
    </p>
    {visibleAdminItems.map((mAdm) => (
    <Link
    key={mAdm.path}
    to={mAdm.path}
    onClick={() => setMobileMenuOpen(false)}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
    location.pathname === mAdm.path
    ? "bg-primary text-primary-foreground"
    : "text-muted-foreground hover:bg-muted"
    }`}
    >
    <mAdm.icon className="h-4 w-4 shrink-0" />
    <span>{mAdm.label}</span>
    </Link>
    ))}
    </div>
    )}
    </div>
    </SheetContent>
    </Sheet>

    {/* Search Bar in Header */}
    <div className="relative w-48 sm:w-72 lg:w-96">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
    placeholder="Search stories, videos, tags..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 h-9 text-sm bg-background/60 focus:bg-background"
    />
    </div>
    </div>

    {/* Right Header Actions */}
    <div className="flex items-center gap-3">
    <Button
    onClick={() => navigate("/create-post")}
    size="sm"
    className="hidden sm:inline-flex items-center gap-1.5 shadow-sm"
    >
    <PenTool className="h-4 w-4" />
    <span>New Post</span>
    </Button>

    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button variant="outline" size="icon" className="relative h-9 w-9">
    <Bell className="h-4 w-4" />
    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
    </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80 bg-popover text-popover-foreground">
    <DropdownMenuLabel className="flex items-center justify-between">
    <span>Notifications</span>
    <Badge variant="secondary" className="text-[10px]">3 unread</Badge>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <div className="space-y-1 p-2">
    <div className="p-2 rounded hover:bg-muted/50 cursor-pointer text-xs space-y-1">
    <p className="font-medium text-foreground">Video Transcoding Complete</p>
    <p className="text-muted-foreground">"Developer Keynote 2025" is processed in 4K & ready to embed.</p>
    <span className="text-[10px] text-primary">12 minutes ago</span>
    </div>
    <div className="p-2 rounded hover:bg-muted/50 cursor-pointer text-xs space-y-1">
    <p className="font-medium text-foreground">Reach Milestone Surpassed</p>
    <p className="text-muted-foreground">Total readership exceeded 140,000 monthly active users!</p>
    <span className="text-[10px] text-primary">2 hours ago</span>
    </div>
    </div>
    </DropdownMenuContent>
    </DropdownMenu>

    <Button
    variant="ghost"
    size="sm"
    className="text-xs text-muted-foreground hover:text-foreground"
    onClick={handleLogout}
    >
    Switch Persona
    </Button>
    </div>
    </header>

    {/* Page Outlet */}
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
    <Outlet />
    </main>
    </div>
    </div>
        );
        }
