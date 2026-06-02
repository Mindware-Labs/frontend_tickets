"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Loader2, Mail, Lock, Eye, EyeOff,
  RefreshCw, KeyRound, ShieldCheck, CheckCircle2, X,
} from "lucide-react";
import {
  InputOTP, InputOTPGroup, InputOTPSlot,
} from "@/components/ui/input-otp";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_components/auth-shell";
import { AuthInput } from "../_components/auth-input";

const PAGE_CSS = `
  @keyframes auth-spin     { to { transform: rotate(360deg); } }
  @keyframes auth-fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes auth-errorIn  { 0%{opacity:0;transform:translateY(-4px)} 60%{transform:translateY(2px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes auth-successIn{ 0%{opacity:0;transform:scale(.90)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }
  @keyframes auth-stepIn   { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }

  .fp-card  { animation: auth-fadeUp    .5s  cubic-bezier(.22,1,.36,1) .12s both; }
  .fp-error { animation: auth-errorIn   .25s ease both; }
  .fp-step  { animation: auth-stepIn    .28s cubic-bezier(.22,1,.36,1) both; }
  .fp-done  { animation: auth-successIn .4s  cubic-bezier(.22,1,.36,1) both; }

  .fp-btn {
    position: relative; overflow: hidden;
    transition: background .15s ease, box-shadow .15s ease, opacity .15s;
  }
  .fp-btn:not(:disabled):hover  { background: #007a5a !important; box-shadow: 0 8px 24px -6px rgba(0,122,90,.40) !important; }
  .fp-btn:not(:disabled):active { background: #065f4a !important; }

  .fp-link { color: #008f68; text-decoration: none; font-weight: 600; transition: color .15s; }
  .fp-link:hover { color: #007a5a; }
`;

const cardStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: 420,
  background: "#ffffff",
  border: "1px solid rgba(15,23,42,0.10)",
  borderRadius: 16,
  padding: "24px 28px 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,.06),0 8px 24px -8px rgba(0,0,0,.08)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

function btnBaseStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 44,
    borderRadius: 8,
    border: 0,
    background: "#008f68",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    opacity: disabled ? 0.5 : 1,
    fontFamily: "inherit",
    width: "100%",
    boxShadow: "0 1px 3px rgba(0,0,0,.08)",
    transition: "background .15s,box-shadow .15s,opacity .15s",
  };
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#64748b",
        letterSpacing: ".06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fp-error"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 12,
        border: "1px solid rgba(239,68,68,.20)",
        background: "rgba(254,242,242,.70)",
        color: "#0f172a",
      }}
    >
      <svg
        style={{ flexShrink: 0, marginTop: 1, color: "#ef4444" }}
        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ margin: 0, flex: 1 }}>{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        style={{ background: "none", border: 0, cursor: "pointer", padding: 2, color: "#94a3b8", display: "flex", flexShrink: 0, transition: "color .15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
      >
        <X size={12} />
      </button>
    </div>
  );
}

const STEPS = ["request", "code", "reset", "done"] as const;
type Step = typeof STEPS[number];

const STEP_META: Record<Step, { title: string; sub: string; icon: React.ElementType }> = {
  request: { title: "Forgot password?",  sub: "Enter your email to receive a 6-digit reset code.", icon: KeyRound    },
  code:    { title: "Check your inbox",  sub: "Enter the code we sent to your email address.",     icon: ShieldCheck  },
  reset:   { title: "New password",      sub: "Choose a strong password to secure your account.",  icon: Lock         },
  done:    { title: "All done!",         sub: "Your password has been reset. Redirecting…",        icon: CheckCircle2 },
};

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step,              setStep             ] = useState<Step>("request");
  const [isLoading,         setIsLoading        ] = useState(false);
  const [isResending,       setIsResending      ] = useState(false);
  const [showPassword,      setShowPassword     ] = useState(false);
  const [showConfirm,       setShowConfirm      ] = useState(false);
  const [error,             setError            ] = useState("");
  const [errorKey,          setErrorKey         ] = useState(0);
  const [email,             setEmail            ] = useState("");
  const [code,              setCode             ] = useState("");
  const [password,          setPassword         ] = useState("");
  const [confirmPassword,   setConfirmPassword  ] = useState("");
  const [resendTimer,       setResendTimer      ] = useState(0);
  const [rateLimitCountdown,setRateLimitCountdown] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_rate_limit_expires");
    if (stored) {
      const remaining = Math.ceil((Number(stored) - Date.now()) / 1000);
      if (remaining > 0) { setRateLimitCountdown(remaining); setError("too_many_requests"); }
      else sessionStorage.removeItem("auth_rate_limit_expires");
    }
  }, []);

  useEffect(() => {
    if (rateLimitCountdown <= 0) { sessionStorage.removeItem("auth_rate_limit_expires"); return; }
    const t = setTimeout(() => setRateLimitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [rateLimitCountdown]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const showError = (msg: string) => { setErrorKey((k) => k + 1); setError(msg); };
  const isRateLimit = (msg: string) =>
    msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("throttler");
  const applyRateLimit = () => {
    sessionStorage.setItem("auth_rate_limit_expires", String(Date.now() + 60_000));
    setRateLimitCountdown(60);
    setErrorKey((k) => k + 1);
    setError("too_many_requests");
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError("");
    try {
      await auth.requestPasswordReset(email.trim().toLowerCase());
      setStep("code"); setResendTimer(120);
    } catch (err: any) {
      const m = err?.message || "Failed to request reset code.";
      if (isRateLimit(m)) applyRateLimit();
      else showError(m.toLowerCase().includes("email not found") ? "Email not registered. Please check and try again." : m);
    } finally { setIsLoading(false); }
  };

  const handleResendCode = async () => {
    setIsResending(true); setError("");
    try {
      await auth.requestPasswordReset(email.trim().toLowerCase());
      setResendTimer(120); setCode("");
    } catch (err: any) {
      const m = err?.message || "Failed to resend code.";
      if (isRateLimit(m)) applyRateLimit(); else showError(m);
    } finally { setIsResending(false); }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (code.trim().length !== 6) { showError("Please enter the 6-digit code."); return; }
    setIsLoading(true);
    auth.verifyResetCode(email.trim().toLowerCase(), code.trim())
      .then(() => setStep("reset"))
      .catch((err: any) => showError(err.message || "Invalid or expired code."))
      .finally(() => setIsLoading(false));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password.length < 6) { showError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { showError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      await auth.resetPasswordWithCode(email.trim().toLowerCase(), code.trim(), password);
      setStep("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      showError(err.message || "Failed to reset password.");
    } finally { setIsLoading(false); }
  };

  const meta     = STEP_META[step];
  const StepIcon = meta.icon;

  return (
    <AuthShell subtitle="Account recovery">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <div className="fp-card" style={cardStyle}>
        {/* Top accent line — DS §5.3 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: "18%", right: "18%", height: 1,
            background: "linear-gradient(90deg,transparent,rgba(0,143,104,.5),transparent)",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* Step header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#f0faf5",
                border: "1px solid rgba(0,143,104,.15)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <StepIcon size={14} style={{ color: "#008f68" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: -0.2 }}>
                {meta.title}
              </h2>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", marginTop: 1 }}>{meta.sub}</p>
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {STEPS.filter((s) => s !== "done").map((s) => (
              <div
                key={s}
                style={{
                  height: 4,
                  borderRadius: 99,
                  transition: "all .25s ease",
                  width: s === step ? 16 : 4,
                  background: s === step
                    ? "#008f68"
                    : STEPS.indexOf(s) < STEPS.indexOf(step)
                      ? "rgba(0,143,104,.35)"
                      : "#e2e8f0",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "#f1f5f9" }} />

        {/* ── STEP: request ── */}
        {step === "request" && (
          <form key="request" className="fp-step" onSubmit={handleRequestCode}
            style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <FieldLabel htmlFor="fp-email">Email address</FieldLabel>
              <AuthInput
                id="fp-email" type="email" autoComplete="email" autoFocus
                value={email} disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ccquest.com"
                leadingIcon={<Mail size={13} />}
              />
            </div>

            {error === "too_many_requests" ? (
              <div key={errorKey} className="fp-error" style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                padding: "10px 12px", borderRadius: 8, fontSize: 12,
                border: "1px solid rgba(180,83,9,.20)",
                background: "rgba(254,243,199,.60)", color: "#0f172a",
              }}>
                <svg style={{ flexShrink: 0, marginTop: 1, color: "#b45309" }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 12 }}>Too many attempts</p>
                  {rateLimitCountdown > 0 && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                      Try again in{" "}
                      <strong style={{ color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{rateLimitCountdown}s</strong>
                    </p>
                  )}
                </div>
              </div>
            ) : error ? (
              <ErrorBanner key={errorKey} message={error} onDismiss={() => setError("")} />
            ) : null}

            <button type="submit" disabled={isLoading || !email.trim() || rateLimitCountdown > 0}
              className="fp-btn" style={btnBaseStyle(isLoading || !email.trim() || rateLimitCountdown > 0)}>
              {isLoading
                ? <><Loader2 size={14} style={{ animation: "auth-spin 1s linear infinite" }} /><span>Sending…</span></>
                : <><span>Send Code</span><ArrowRight size={13} /></>}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", margin: 0 }}>
              Remembered it?{" "}
              <Link href="/login" className="fp-link">Sign in</Link>
            </p>
          </form>
        )}

        {/* ── STEP: code ── */}
        {step === "code" && (
          <form key="code" className="fp-step" onSubmit={handleVerifyCode}
            style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Code sent to{" "}
              <strong style={{ color: "#0f172a", fontWeight: 600 }}>{email}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <FieldLabel>Verification Code</FieldLabel>
              <InputOTP value={code} onChange={setCode} maxLength={6} inputMode="numeric"
                containerClassName="w-full gap-2">
                <InputOTPGroup className="w-full gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="flex-1 h-10 rounded-lg border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 text-center outline-none transition-all duration-150 min-w-0 focus:border-[#008f68] focus:ring-2 focus:ring-[#008f68]/20 focus:bg-white"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <ErrorBanner key={errorKey} message={error} onDismiss={() => setError("")} />}

            <button type="submit" disabled={isLoading || code.length !== 6}
              className="fp-btn" style={btnBaseStyle(isLoading || code.length !== 6)}>
              {isLoading
                ? <><Loader2 size={14} style={{ animation: "auth-spin 1s linear infinite" }} /><span>Verifying…</span></>
                : <><span>Continue</span><ArrowRight size={13} /></>}
            </button>

            <div style={{ textAlign: "center" }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                  Resend in{" "}
                  <strong style={{ color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                    {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, "0")}
                  </strong>
                </p>
              ) : (
                <button type="button" onClick={handleResendCode} disabled={isResending}
                  style={{ background: "none", border: 0, cursor: "pointer", fontSize: 12, color: "#008f68", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, padding: 0, fontFamily: "inherit" }}>
                  {isResending ? <Loader2 size={11} style={{ animation: "auth-spin 1s linear infinite" }} /> : <RefreshCw size={11} />}
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP: reset ── */}
        {step === "reset" && (
          <form key="reset" className="fp-step" onSubmit={handleResetPassword}
            style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <FieldLabel htmlFor="fp-password">New Password</FieldLabel>
              <AuthInput
                id="fp-password" type={showPassword ? "text" : "password"}
                autoComplete="new-password" autoFocus
                value={password} disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leadingIcon={<Lock size={13} />}
                trailing={
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer", padding: "0 2px", display: "inline-flex", flexShrink: 0, transition: "color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <FieldLabel htmlFor="fp-confirm">Confirm Password</FieldLabel>
              <AuthInput
                id="fp-confirm" type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword} disabled={isLoading}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                leadingIcon={<Lock size={13} />}
                trailing={
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer", padding: "0 2px", display: "inline-flex", flexShrink: 0, transition: "color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                }
              />
            </div>

            {error && <ErrorBanner key={errorKey} message={error} onDismiss={() => setError("")} />}

            <button type="submit" disabled={isLoading || !password || !confirmPassword}
              className="fp-btn" style={btnBaseStyle(isLoading || !password || !confirmPassword)}>
              {isLoading
                ? <><Loader2 size={14} style={{ animation: "auth-spin 1s linear infinite" }} /><span>Resetting…</span></>
                : <><span>Reset Password</span><ArrowRight size={13} /></>}
            </button>
          </form>
        )}

        {/* ── STEP: done ── */}
        {step === "done" && (
          <div key="done" className="fp-done"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0 4px", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "#f0faf5", border: "1px solid rgba(0,143,104,.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle2 size={26} style={{ color: "#008f68" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Password updated!</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Redirecting you to sign in…</p>
            </div>
            <button type="button" onClick={() => router.push("/login")} className="fp-btn"
              style={btnBaseStyle(false)}>
              <span>Go to Sign In</span><ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
