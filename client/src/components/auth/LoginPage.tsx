import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowRight, Check, Eye, EyeOff, Layers, Lock, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@rhino-dev/rhino-react";

export default function Login() {
    const navigate = useNavigate()
    const { login, setOrganization } = useAuth()
    const [email, setEmail] = useState("sarah.chen@contentreach.io")
    const [password, setPassword] = useState("password")
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)
    const [selectedPersona, setSelectedPersona] = useState("manager")
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const handleSelectPersona = (persona) => {
      setSelectedPersona(persona)
      if (persona === "manager") {
        setEmail("sarah.chen@contentreach.io")
      } else {
        setEmail("alex.thorne@contentreach.io")
      }
    }
    const handleSubmit = async (e) => {
      e.preventDefault()
      setIsLoading(true)
      setErrorMessage("")
      setSuccessMessage("")
      const result = await login(email, password)
      setIsLoading(false)
      if (!result.success) {
        setErrorMessage(result.error || "Login failed")
        return
      }
      if (result.organization_slug) setOrganization(result.organization_slug)
      setSuccessMessage(`Authenticated. Redirecting...`)
      const signedInEmail = result.user && result.user.email ? result.user.email : email
      window.setTimeout(() => {
        if (signedInEmail.startsWith("alex.thorne")) {
          navigate("/admin")
        } else {
          navigate("/")
        }
      }, 600)
    }
  return (
   <div className="min-h-screen bg-background w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-center min-h-[85vh] px-4 w-full min-w-0">
          <div className="max-w-md mx-auto my-12 bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
      <div className="mx-auto w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
      <Layers className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In to ContentReach</h1>
      <p className="text-xs sm:text-sm text-muted-foreground">
      Select a demo persona or enter your credentials to explore the publishing console.
      </p>
      </div>

      <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Quick Demo Personas
      </Label>
      <div className="grid grid-cols-2 gap-2">
      <button
      type="button"
      onClick={() => handleSelectPersona("manager")}
      className={`p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
      selectedPersona === "manager"
      ? "border-primary bg-primary/10 text-primary shadow-xs"
      : "border-border hover:bg-muted/60 text-foreground"
      }`}
      >
      <div className="flex items-center justify-between w-full">
      <span className="font-semibold">Sarah Chen</span>
      {selectedPersona === "manager" && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
      <span className="text-[11px] text-muted-foreground">Content Manager</span>
      </button>

      <button
      type="button"
      onClick={() => handleSelectPersona("admin")}
      className={`p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
      selectedPersona === "admin"
      ? "border-primary bg-primary/10 text-primary shadow-xs"
      : "border-border hover:bg-muted/60 text-foreground"
      }`}
      >
      <div className="flex items-center justify-between w-full">
      <span className="font-semibold">Alex Thorne</span>
      {selectedPersona === "admin" && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
      <span className="text-[11px] text-muted-foreground">System Admin</span>
      </button>
      </div>
      </div>

      {errorMessage ? (
      <Alert className="bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 py-2.5">
      <AlertDescription className="text-xs font-medium ml-2">
      {errorMessage}
      </AlertDescription>
      </Alert>
      ) : null}

      {successMessage ? (
      <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2.5">
      <Check className="h-4 w-4" />
      <AlertDescription className="text-xs font-medium ml-2">
      {successMessage}
      </AlertDescription>
      </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
      <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>
      <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      className="pl-9 h-10 text-sm"
      placeholder="name@company.com"
      />
      </div>
      </div>

      <div className="space-y-1.5">
      <div className="flex items-center justify-between">
      <Label htmlFor="password" className="text-xs font-medium">Password</Label>
      <button
      type="button"
      className="text-[11px] text-primary hover:underline"
      >
      Forgot password?
      </button>
      </div>
      <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
      id="password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      className="pl-9 pr-9 h-10 text-sm font-mono"
      />
      <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      </div>
      </div>

      <div className="flex items-center space-x-2 pt-1">
      <Checkbox
      id="remember"
      checked={rememberMe}
      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
      />
      <label
      htmlFor="remember"
      className="text-xs font-medium leading-none text-muted-foreground cursor-pointer"
      >
      Remember this workstation for 30 days
      </label>
      </div>

      <Button
      type="submit"
      disabled={isLoading}
      className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 mt-2"
      >
      <span>{isLoading ? "Authenticating..." : `Sign In as ${selectedPersona === "admin" ? "Alex (Admin)" : "Sarah (Editor)"}`}</span>
      <ArrowRight className="h-4 w-4" />
      </Button>
      </form>

      <div className="border-t border-border pt-4 text-center">
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
      <Shield className="h-3.5 w-3.5 text-primary" />
      <span>Protected with SSO, SAML 2.0 and biometric 2FA</span>
      </p>
      </div>
      </div>
      </div>
    </div>
  );
}