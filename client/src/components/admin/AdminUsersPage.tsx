import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContentStatusBadge from "@/components/shared/ContentStatusBadge";

import { ArrowLeft, Check, Key, Mail, MoreVertical, Save, Search, Shield, ShieldAlert, ShieldCheck, Trash2, UserCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInviteUser, useModelDelete, useModelIndex, useModelUpdate } from "@rhino-dev/rhino-react";

export default function AdminUsers() {
    const navigate = useNavigate()
    const [searchFilter, setSearchFilter] = useState("")
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteName, setInviteName] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("Editor")
    const [errorMessage, setErrorMessage] = useState("")

    const { data: usersResponse, isLoading } = useModelIndex("users", {
      search: searchFilter || undefined,
      sort: "-created_at",
    })
    const { data: rolesResponse } = useModelIndex("roles")
    const { data: permissionsResponse } = useModelIndex("role_permissions")
    const inviteUser = useInviteUser()
    const updateUser = useModelUpdate("users")
    const deleteUser = useModelDelete("users")
    const updateRolePermission = useModelUpdate("role_permissions")

    const roles = rolesResponse?.data ?? []
    const roleIdByName = (name: string) =>
      roles.find((role: any) => (role.name ?? "").toLowerCase() === name.toLowerCase())?.id

    const handleSendInvite = () => {
      setErrorMessage("")
      const roleId = roleIdByName(inviteRole)
      inviteUser.mutate(
        { email: inviteEmail, role_id: roleId },
        {
          onSuccess: () => {
            setInviteOpen(false)
            setInviteName("")
            setInviteEmail("")
          },
          onError: (err: any) => {
            const errors = err?.response?.data?.errors
            const firstError = errors ? Object.values(errors).flat()[0] : null
            setErrorMessage(
              firstError ?? err?.response?.data?.message ?? "Could not send the invitation.",
            )
          },
        },
      )
    }

    const ROLE_ORDER = ["contributor", "editor", "content_manager", "admin"]

    const users = (usersResponse?.data ?? []).map((user: any) => {
      const roleName = user.role_name ?? "Contributor"
      const roleSlug = user.role_slug ?? roleName.toLowerCase().replace(/\s+/g, "_")
      return {
        id: user.id,
        name: user.full_name ?? user.name ?? user.email,
        email: user.email,
        role: roleName,
        roleSlug,
        twoFactor: Boolean(user.approved),
        status: user.approved === false ? "Inactive" : "Active",
        lastActive: user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString("en-US")
          : "—",
        avatar: user.avatar_url ?? undefined,
      }
    })

    const handleToggleStatus = (id: number) => {
      const target = users.find((u) => u.id === id)
      if (!target) return
      setErrorMessage("")
      updateUser.mutate(
        { id, data: { approved: target.status === "Active" ? false : true } },
        {
          onError: (err: any) =>
            setErrorMessage(err?.response?.data?.message ?? "Could not update the member."),
        },
      )
    }
    const handleToggleRole = (id: number) => {
      const target = users.find((u) => u.id === id)
      if (!target) return
      const index = ROLE_ORDER.indexOf(target.roleSlug)
      const nextSlug = ROLE_ORDER[(index + 1) % ROLE_ORDER.length]
      const nextRoleId = roles.find((role: any) => role.slug === nextSlug)?.id
      setErrorMessage("")
      updateUser.mutate(
        { id, data: { role_id: nextRoleId } },
        {
          onError: (err: any) =>
            setErrorMessage(err?.response?.data?.message ?? "Could not change the role."),
        },
      )
    }
    const handleDeleteUser = (id: number) => {
      setErrorMessage("")
      deleteUser.mutate(id, {
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not revoke the seat."),
      })
    }
    const [isSaved, setIsSaved] = useState(false)
    const permissions = (permissionsResponse?.data ?? []).map((row: any) => ({
      id: row.id,
      label: row.capability ?? "Capability",
      desc: row.description ?? "",
      roleKey: row.role_key,
      enabled: Boolean(row.enabled),
    }))
    const capabilities = Array.from(new Set(permissions.map((p) => p.label)))
    const matrix = capabilities.map((label) => ({
      label,
      desc: permissions.find((p) => p.label === label)?.desc ?? "",
      cells: {
        admin: Boolean(permissions.find((p) => p.label === label && p.roleKey === "admin")?.enabled),
        manager: Boolean(
          permissions.find((p) => p.label === label && p.roleKey === "content_manager")?.enabled,
        ),
        editor: Boolean(permissions.find((p) => p.label === label && p.roleKey === "editor")?.enabled),
        contributor: Boolean(
          permissions.find((p) => p.label === label && p.roleKey === "contributor")?.enabled,
        ),
      },
    }))
    const handleToggle = (label: string, roleKey: string) => {
      const row = permissions.find((p) => p.label === label && p.roleKey === roleKey)
      if (!row) return
      setErrorMessage("")
      updateRolePermission.mutate(
        { id: row.id, data: { enabled: !row.enabled } },
        {
          onError: (err: any) =>
            setErrorMessage(err?.response?.data?.message ?? "Could not update the permission."),
        },
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
      {users.length} Members
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
      <Button size="sm" onClick={handleSendInvite} disabled={inviteUser.isPending} className="bg-primary text-primary-foreground">
      {inviteUser.isPending ? "Sending..." : "Send Invitation"}
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

      {errorMessage ? (
      <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}

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
      {isLoading ? (
      <TableRow>
      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
      Loading team members…
      </TableCell>
      </TableRow>
      ) : users.length === 0 ? (
      <TableRow>
      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
      No team members found.
      </TableCell>
      </TableRow>
      ) : users.map((user) => (
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
      {matrix.map((perm) => (
      <TableRow key={perm.label} className="hover:bg-muted/30">
      <TableCell>
      <p className="font-semibold text-sm text-foreground">{perm.label}</p>
      <p className="text-xs text-muted-foreground">{perm.desc}</p>
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.cells.admin}
      disabled={true}
      className="opacity-90"
      />
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.cells.manager}
      onCheckedChange={() => handleToggle(perm.label, "content_manager")}
      />
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.cells.editor}
      onCheckedChange={() => handleToggle(perm.label, "editor")}
      />
      </TableCell>
      <TableCell className="text-center">
      <Checkbox
      checked={perm.cells.contributor}
      onCheckedChange={() => handleToggle(perm.label, "contributor")}
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