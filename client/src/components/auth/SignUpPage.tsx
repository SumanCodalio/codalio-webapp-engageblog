import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowRight, Check, Layers, Lock, Mail, Shield, User } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRegister } from "@rhino-dev/rhino-react";

/**
 * Registration — required auth entry point the design root omitted.
 *
 * Rhino v4 registration is invitation-token based (there is no open public
 * signup), so this page consumes the invitation token from the invite email
 * and calls `POST /api/auth/register`. Built with the design's own primitives
 * and typography; standalone full-screen, OUTSIDE the authenticated shell.
 */
export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const register = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("An invitation token is required to create an account.");
      return;
    }

    register.mutate(
      {
        token,
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Account created. Redirecting to sign in...");
          window.setTimeout(() => navigate("/login", { replace: true }), 800);
        },
        onError: (err: any) => {
          const errors = err?.response?.data?.errors;
          const firstError = errors ? Object.values(errors).flat()[0] : null;
          setErrorMessage(
            firstError ?? err?.response?.data?.message ?? "Could not create the account.",
          );
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-center min-h-[85vh] px-4 w-full min-w-0">
        <div className="max-w-md mx-auto my-12 bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
              <Layers className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Join ContentReach
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Accept your invitation to set up your publishing console account.
            </p>
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
              <Label htmlFor="name" className="text-xs font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-9 h-10 text-sm"
                  placeholder="e.g. Marcus Vance"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Work Email
              </Label>
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
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 h-10 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password-confirmation" className="text-xs font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password-confirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className="pl-9 h-10 text-sm font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 mt-2"
            >
              <span>{register.isPending ? "Creating account..." : "Create Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[11px] text-primary hover:underline"
            >
              Already have an account? Sign in
            </button>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-3">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Protected with SSO, SAML 2.0 and biometric 2FA</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
