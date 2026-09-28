import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import ContentStatusBadge from "../components/ContentStatusBadge";

import { ArrowLeft, Check, Key, Mail, MoreVertical, Save, Search, Shield, ShieldAlert, ShieldCheck, Trash2, UserCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
    const navigate = useNavigate()
    const [searchFilter, setSearchFilter] = useState("")
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteName, setInviteName] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("Editor")
    const handleSendInvite = () => {
      setInviteOpen(false)
      setInviteName("")
      setInviteEmail("")
    }
    const [users, setUsers] = useState([
      {
        id: "usr-1",
        name: "Alex Thorne",
        email: "alex.thorne@contentreach.io",
        role: "Admin",
        twoFactor: true,
        status: "Active",
        lastActive: "Just now",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "usr-2",
        name: "Sarah Chen",
        email: "sarah.chen@contentreach.io",
        role: "Content Manager",
        twoFactor: true,
        status: "Active",
        lastActive: "15 mins ago",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "usr-3",
        name: "David Kim",
        email: "david.kim@contentreach.io",
        role: "Editor",
        twoFactor: true,
        status: "Active",
        lastActive: "2 hours ago",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "usr-4",
        name: "Elena Rostova",
        email: "elena.r@contentreach.io",
        role: "Editor",
        twoFactor: false,
        status: "Active",
        lastActive: "Yesterday",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "usr-5",
        name: "Liam O'Connor",
        email: "liam.oc@contentreach.io",
        role: "Contributor",
        twoFactor: true,
        status: "Active",
        lastActive: "3 days ago",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      },
    ])
    const handleToggleStatus = (id) => {
      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
        )
      )
    }
    const handleToggleRole = (id) => {
      setUsers(
        users.map((u) => {
          if (u.id !== id) return u
          const nextRole =
            u.role === "Contributor"
              ? "Editor"
              : u.role === "Editor"
              ? "Content Manager"
              : u.role === "Content Manager"
              ? "Admin"
              : "Contributor"
          return { ...u, role: nextRole }
        })
      )
    }
    const handleDeleteUser = (id) => {
      setUsers(users.filter((u) => u.id !== id))
    }
    const [isSaved, setIsSaved] = useState(false)
    const [permissions, setPermissions] = useState([
      {
        id: "perm-publish",
        label: "Publish Posts & Live Videos",
        desc: "Broadcast articles directly to public feed without approval",
        admin: true,
        manager: true,
        editor: true,
        contributor: false,
      },
      {
        id: "perm-transcode-4k",
        label: "Upload 4K & Files >1GB",
        desc: "Allocate high-bandwidth edge transcoding compute",
        admin: true,
        manager: true,
        editor: false,
        contributor: false,
      },
      {
        id: "perm-api-keys",
        label: "Manage API Keys & Webhooks",
        desc: "Generate secret tokens for external syndication services",
        admin: true,
        manager: false,
        editor: false,
        contributor: false,
      },
      {
        id: "perm-analytics-raw",
        label: "Export Raw Reader Telemetry",
        desc: "Download unaggregated CSV logs of visitor retention",
        admin: true,
        manager: true,
        editor: true,
        contributor: false,
      },
      {
        id: "perm-security-config",
        label: "Modify Security & SSO Policies",
        desc: "Enforce multi-factor auth and configure SAML 2.0 endpoints",
        admin: true,
        manager: false,
        editor: false,
        contributor: false,
      },
    ])
    const handleToggle = (index, role) => {
      setPermissions(
        permissions.map((p, i) =>
          i === index ? { ...p, [role]: !p[role] } : p
        )
      )
    }
    const handleSavePermissions = () => {
      setIsSaved(true)
      window.setTimeout(() => setIsSaved(false), 2000)
    }
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
      Team & Role Governance
      </h1>
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
      12 Members
      </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
      Manage workspace seats, configure editorial access scopes, and provision SSO permissions.
      </p>
      </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
      <div className="relative w-full sm:w-60">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
      placeholder="Find team member..."
      value={searchFilter}
      onChange={(e) => setSearchFilter(e.target.value)}
      className="pl-8 h-9 text-xs"
      />
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogTrigger asChild>
      <Button size="sm" className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm">
      <UserPlus className="h-4 w-4" />
      <span>Invite Member</span>
      </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
      <DialogHeader>
      <DialogTitle className="text-lg">Invite New Contributor</DialogTitle>
      <DialogDescription className="text-xs text-muted-foreground">
      An email invite with SSO activation link will be sent to the user.
      </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
      <div className="space-y-1.5">
      <Label className="text-xs">Full Name</Label>
      <Input
      placeholder="e.g. Marcus Vance"
      value={inviteName}
      onChange={(e) => setInviteName(e.target.value)}
      className="h-9 text-xs"
      />
      </div>

      <div className="space-y-1.5">
      <Label className="text-xs">Work Email Address</Label>
      <Input
      type="email"
      placeholder="m.vance@company.com"
      value={inviteEmail}
      onChange={(e) => setInviteEmail(e.target.value)}
      className="h-9 text-xs"
      />
      </div>

      <div className="space-y-1.5">
      <Label className="text-xs">Assigned Workspace Role</Label>
      <Select value={inviteRole} onValueChange={setInviteRole}>
      <SelectTrigger className="h-9 text-xs">
      <SelectValue placeholder="Select Role" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
      <SelectItem value="Admin">Admin (Full Access)</SelectItem>
      <SelectItem value="Content Manager">Content Manager</SelectItem>
      <SelectItem value="Editor">Editor</SelectItem>
      <SelectItem value="Contributor">Contributor (Draft Only)</SelectItem>
      </SelectContent>
      </Select>
      </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="outline" size="sm" onClick={() => setInviteOpen(false)}>
      Cancel
      </Button>
      <Button size="sm" onClick={handleSendInvite} className="bg-primary text-primary-foreground">
      Send Invitation
      </Button>
      </DialogFooter>
      </DialogContent>
      </Dialog>
      </div>
      </div>
  <Card className="w-full bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
      <div>
      <CardTitle className="text-lg font-bold text-foreground">Active Team Members</CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">
      Assigned roles determine video upload sizes, publishing triggers, and billing permissions.
      </CardDescription>
      </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
      <Table>
      <TableHeader className="bg-muted/40">
      <TableRow>
      <TableHead>User & Identity</TableHead>
      <TableHead className="w-36">Role</TableHead>
      <TableHead className="w-28 text-center">2FA Status</TableHead>
      <TableHead className="w-28 text-center">Status</TableHead>
      <TableHead className="w-36 text-right">Last Active</TableHead>
      <TableHead className="w-16 text-right">Actions</TableHead>
      </TableRow>
      </TableHeader>
      <TableBody>
      {users.map((user) => (
      <TableRow key={user.id} className="hover:bg-muted/30">
      <TableCell>
      <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 border border-border">
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
      {user.name.substring(0, 2)}
      </AvatarFallback>
      </Avatar>
      <div>
      <p className="text-sm font-semibold text-foreground">{user.name}</p>
      <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
      </div>
      </div>
      </TableCell>
      <TableCell>
      <Badge
      variant="outline"
      className="text-xs font-medium bg-primary/10 text-primary border-primary/20"
      >
      {user.role}
      </Badge>
      </TableCell>
      <TableCell className="text-center">
      {user.twoFactor ? (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
      <ShieldCheck className="h-3.5 w-3.5" /> Enforced
      </span>
      ) : (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
      <ShieldAlert className="h-3.5 w-3.5" /> Pending
      </span>
      )}
      </TableCell>
      <TableCell className="text-center">
      <ContentStatusBadge status={user.status} />
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">
      {user.lastActive}
      </TableCell>
      <TableCell className="text-right">
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
      <MoreVertical className="h-4 w-4" />
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
      <DropdownMenuItem onClick={() => handleToggleRole(user.id)}>
      <Key className="h-3.5 w-3.5 mr-2" /> Change Role
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
      <UserCheck className="h-3.5 w-3.5 mr-2" /> Toggle Active Status
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
      onClick={() => handleDeleteUser(user.id)}
      className="text-destructive focus:text-destructive"
      >
      <Trash2 className="h-3.5 w-3.5 mr-2" /> Revoke Seat
      </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      </TableCell>
      </TableRow>
      ))}
      </TableBody>
      </Table>
      </div>
      </Card>
  <Card className="w-full bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
      <Shield className="h-5 w-5" />
      </div>
      <div>
      <CardTitle className="text-lg font-bold text-foreground">
      Role Capabilities & Permissions Matrix
      </CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">
      Fine-tune the security baseline for each role in your organization.
      </CardDescription>
      </div>
      </div>

      <Button
      size="sm"
      onClick={handleSavePermissions}
      disabled={isSaved}
      className="text-xs bg-primary text-primary-foreground gap-1.5"
      >
      {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
      <span>{isSaved ? "Saved Changes" : "Save Matrix"}</span>
      </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
      <Table>
      <TableHeader className="bg-muted/40">
      <TableRow>
      <TableHead>Capability / Permission Scope</TableHead>
      <TableHead className="w-28 text-center">Admin</TableHead>
      <TableHead className="w-36 text-center">Content Mgr</TableHead>
      <TableHead className="w-28 text-center">Editor</TableHead>
      <TableHead className="w-32 text-center">Contributor</TableHead>
      </TableRow>
      </TableHeader>
      <TableBody>
      {permissions.map((perm, idx) => (
      <TableRow key={perm.id} className="hover:bg-muted/30">
      <TableCell>
      <p className="font-semibold text-sm text-foreground">{perm.label}</p>
      <p className="text-xs text-muted-foreground">{perm.desc}</p>
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.admin}
      disabled={true}
      className="opacity-90"
      />
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.manager}
      onCheckedChange={() => handleToggle(idx, "manager")}
      />
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.editor}
      onCheckedChange={() => handleToggle(idx, "editor")}
      />
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.contributor}
      onCheckedChange={() => handleToggle(idx, "contributor")}
      />
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