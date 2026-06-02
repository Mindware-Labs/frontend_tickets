"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Loader2, ArrowRight, Lock, Mail, X, CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_components/auth-shell";
import { AuthInput } from "../_components/auth-input";

const PAGE_CSS = `
  @keyframes auth-spin     { to { transform: rotate(360deg); } }
  @keyframes auth-fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes auth-errorIn  { 0%{opacity:0;transform:translateY(-4px)} 60%{transform:translateY(2px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes auth-successIn{ 0%{opacity:0;transform:scale(.90)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }
  @keyframes auth-capsIn   { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }

  .lu-card    { animation: auth-fadeUp    .5s  cubic-bezier(.22,1,.36,1) .12s both; }
  .lu-error   { animation: auth-errorIn   .25s ease both; }
  .lu-caps    { animation: auth-capsIn    .2s  ease both; }
  .lu-success { animation: auth-successIn .4s  cubic-bezier(.22,1,.36,1) both; }

  .lu-btn {
    position: relative; overflow: hidden;
    transition: background .15s ease, box-shadow .15s ease, opacity .15s;
  }
  .lu-btn:not(:disabled):hover  { background: #007a5a !important; box-shadow: 0 8px 24px -6px rgba(0,122,90,.40) !important; }
  .lu-btn:not(:disabled):active { background: #065f4a !important; }

  .lu-link { color: #008f68; text-decoration: none; font-weight: 600; position: relative; transition: color .15s; }
  .lu-link:hover { color: #007a5a; }
`;

/* Shared card shell — DS §5.2 appPanelClass */
const cardStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: 420,
  background: "#ffffff",
  border: "1px solid rgba(15,23,42,0.10)",
  borderRadius: 16,
  padding: "28px 28px 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,.06),0 8px 24px -8px rgba(0,0,0,.08)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

/* DS §8.5 primary button */
const btnStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 8,
  border: 0,
  background: "#008f68",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontFamily: "inherit",
  marginTop: 2,
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
};

function LabelRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {children}
    </div>
  );
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

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [isLoading,           setIsLoading          ] = useState(false);
  const [showPassword,        setShowPassword       ] = useState(false);
  const [error,               setError              ] = useState("");
  const [errorKey,            setErrorKey           ] = useState(0);
  const [rateLimitCountdown,  setRateLimitCountdown ] = useState(0);
  const [formData,            setFormData           ] = useState({ email: "", password: "" });
  const [success,             setSuccess            ] = useState(false);
  const [emailInvalid,        setEmailInvalid       ] = useState(false);
  const [capsLock,            setCapsLock           ] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_rate_limit_expires");
    if (stored) {
      const remaining = Math.ceil((Number(stored) - Date.now()) / 1000);
      if (remaining > 0) {
        setRateLimitCountdown(remaining);
        setError("too_many_requests");
      } else {
        sessionStorage.removeItem("auth_rate_limit_expires");
      }
    }
  }, []);

  useEffect(() => {
    if (rateLimitCountdown <= 0) {
      sessionStorage.removeItem("auth_rate_limit_expires");
      return;
    }
    const timer = setTimeout(() => setRateLimitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  const handleCapsLock = (e: React.KeyboardEvent) => setCapsLock(e.getModifierState("CapsLock"));

  const handleEmailBlur = () => {
    setEmailInvalid(!!formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInvalid) return;
    setIsLoading(true);
    setError("");
    try {
      await auth.login(formData.email, formData.password);
      setSuccess(true);
      setTimeout(() => {
        const redirect = searchParams.get("redirect");
        router.push(redirect || "/dashboard");
      }, 900);
    } catch (err: any) {
      const msg: string = err.message || "Login failed. Please check your credentials.";
      setErrorKey((k) => k + 1);
      if (msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("throttler")) {
        const expiresAt = Date.now() + 60_000;
        sessionStorage.setItem("auth_rate_limit_expires", String(expiresAt));
        setRateLimitCountdown(60);
        setError("too_many_requests");
      } else if (msg.includes("Cannot connect to the server")) {
        setError("Unable to connect to the server. Ensure the backend is running.");
      } else if (msg.includes("fetch")) {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isBusy = isLoading || success;

  return (
    <AuthShell subtitle="Sign in to your operations workspace">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <form onSubmit={handleSubmit} className="lu-card" style={cardStyle}>
        {/* Top accent line — DS §5.3 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "18%",
            right: "18%",
            height: 1,
            background: "linear-gradient(90deg,transparent,rgba(0,143,104,.5),transparent)",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* Success overlay */}
        {success && (
          <div
            className="lu-success"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              zIndex: 20,
              background: "rgba(255,255,255,.96)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#f0faf5",
                border: "1px solid rgba(0,143,104,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={24} style={{ color: "#008f68" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Signed in successfully
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                Redirecting to dashboard…
              </p>
            </div>
          </div>
        )}

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 2 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: -0.3 }}>
            Welcome back
          </h2>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f1f5f9", margin: "-4px 0 0" }} />

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <LabelRow>
            <FieldLabel htmlFor="login-email">Email address</FieldLabel>
            {emailInvalid && (
              <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 500 }}>
                Invalid email format
              </span>
            )}
          </LabelRow>
          <AuthInput
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            disabled={isBusy}
            invalid={emailInvalid}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (emailInvalid) setEmailInvalid(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEmailBlur();
                document.getElementById("login-password")?.focus();
              }
            }}
            onBlur={handleEmailBlur}
            placeholder="you@ccquest.com"
            leadingIcon={<Mail size={13} />}
          />
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <LabelRow>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Link href="/forgot-password" className="lu-link" style={{ fontSize: 12 }}>
              Forgot password?
            </Link>
          </LabelRow>
          <AuthInput
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={formData.password}
            disabled={isBusy}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onKeyDown={handleCapsLock}
            placeholder="••••••••"
            leadingIcon={<Lock size={13} />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isBusy}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0 2px",
                  display: "inline-flex",
                  flexShrink: 0,
                  transition: "color .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            }
          />
          {capsLock && !showPassword && (
            <div
              className="lu-caps"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#b45309" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12M12 12L8 16M12 12L16 16M20 9H4l8-7 8 7z" />
              </svg>
              Caps Lock is on
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            key={errorKey}
            className="lu-error"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 12,
              border: error === "too_many_requests"
                ? "1px solid rgba(180,83,9,.20)"
                : "1px solid rgba(239,68,68,.20)",
              background: error === "too_many_requests"
                ? "rgba(254,243,199,.60)"
                : "rgba(254,242,242,.70)",
              color: "#0f172a",
            }}
          >
            <svg
              style={{
                flexShrink: 0,
                marginTop: 1,
                color: error === "too_many_requests" ? "#b45309" : "#ef4444",
              }}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              {error === "too_many_requests" ? (
                <>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 12 }}>Too many failed attempts</p>
                  {rateLimitCountdown > 0 && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                      Try again in{" "}
                      <strong style={{ color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                        {rateLimitCountdown}s
                      </strong>
                    </p>
                  )}
                </>
              ) : (
                <p style={{ margin: 0 }}>{error}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: 2,
                color: "#94a3b8",
                display: "flex",
                flexShrink: 0,
                transition: "color .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Submit — DS §8.5 */}
        <button
          type="submit"
          disabled={isBusy || rateLimitCountdown > 0 || emailInvalid}
          className="lu-btn"
          style={{
            ...btnStyle,
            opacity: rateLimitCountdown > 0 || emailInvalid ? 0.5 : 1,
            cursor: isBusy ? "wait" : rateLimitCountdown > 0 || emailInvalid ? "not-allowed" : "pointer",
          }}
        >
          {isLoading
            ? <><Loader2 size={14} style={{ animation: "auth-spin 1s linear infinite" }} /><span>Signing in…</span></>
            : <><span>Sign in</span><ArrowRight size={13} /></>}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#f4f5f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`@keyframes auth-spin{to{transform:rotate(360deg)}}`}</style>
          <Loader2 size={24} style={{ color: "#008f68", animation: "auth-spin 1s linear infinite" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
