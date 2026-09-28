import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowRight, Check, Layers, Lock, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePasswordRecover, useResetPassword } from "@rhino-dev/rhino-react";

/**
 * Password reset — required auth entry point the design root omitted.
 *
 * Built with the design's own primitives (Card/Input/Label/Button/Alert) and
 * typography so it is visually indistinguishable from the Login page. It is a
 * standalone full-screen page: it lives OUTSIDE the authenticated app shell.
 *
 * Two modes, both hitting Rhino v4 authentication:
 *   - no `?token=` → request a reset link (POST /api/auth/password/recover)
 *   - `?token=`    → set a new password   (POST /api/auth/password/reset)
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const isReset = Boolean(token);

  const recover = usePasswordRecover();
  const reset = useResetPassword();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (isReset) {
      reset.mutate(
        { token, email, password, password_confirmation: passwordConfirmation },
        {
          onSuccess: () => {
            setSuccessMessage("Password updated. Redirecting to sign in...");
            window.setTimeout(() => navigate("/login", { replace: true }), 800);
          },
          onError: (err: any) => {
            const errors = err?.response?.data?.errors;
            const firstError = errors ? Object.values(errors).flat()[0] : null;
            setErrorMessage(
              firstError ?? err?.response?.data?.message ?? "Could not reset the password.",
            );
          },
        },
      );
      return;
    }

    recover.mutate(
      { email },
      {
        onSuccess: () => setSuccessMessage("If that email exists, a reset link is on its way."),
        onError: (err: any) =>
          setErrorMessage(err?.response?.data?.message ?? "Could not send the reset link."),
      },
    );
  };

  const isPending = isReset ? reset.isPending : recover.isPending;

  return (
    <div className="min-h-screen bg-background w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-center min-h-[85vh] px-4 w-full min-w-0">
        <div className="max-w-md mx-auto my-12 bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
              <Layers className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isReset ? "Set a New Password" : "Reset Your Password"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isReset
                ? "Choose a new password for your ContentReach account."
                : "Enter your work email and we will send you a secure reset link."}
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

            {isReset ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium">
                    New Password
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
                    Confirm New Password
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
              </>
            ) : null}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 mt-2"
            >
              <span>
                {isPending
                  ? "Working..."
                  : isReset
                  ? "Update Password"
                  : "Send Reset Link"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[11px] text-primary hover:underline"
            >
              Back to sign in
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
