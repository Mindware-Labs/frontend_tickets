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
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes errorIn { 0%{opacity:0;transform:translateY(-6px)} 60%{transform:translateY(2px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes successIn { 0%{opacity:0;transform:scale(.88)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
  @keyframes capsIn  { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

  .lu-card    { animation: fadeUp    .6s  cubic-bezier(.22,1,.36,1) .14s both; }
  .lu-error   { animation: errorIn   .3s  ease both; }
  .lu-caps    { animation: capsIn    .22s ease both; }
  .lu-success { animation: successIn .45s cubic-bezier(.22,1,.36,1) both; }

  .lu-btn {
    position: relative; overflow: hidden;
    transition: filter .18s ease, box-shadow .18s ease;
  }
  .lu-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);
    transform: translateX(-100%) skewX(-15deg); transition: none;
  }
  .lu-btn:not(:disabled):hover { filter: brightness(1.08); box-shadow: 0 18px 36px -12px rgba(15,93,78,.50) !important; }
  .lu-btn:not(:disabled):hover::after { transform: translateX(240%) skewX(-15deg); transition: transform .55s ease; }
  .lu-btn:not(:disabled):active { filter: brightness(.96); box-shadow: 0 4px 12px -6px rgba(15,93,78,.35) !important; }

  .lu-link { position: relative; transition: color .15s ease; }
  .lu-link::after { content: ''; position: absolute; left: 0; bottom: -1px; right: 0; height: 1px; background: #0F5D4E; transform: scaleX(0); transform-origin: left; transition: transform .2s ease; }
  .lu-link:hover::after { transform: scaleX(1); }
`;

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [isLoading,          setIsLoading         ] = useState(false);
  const [showPassword,       setShowPassword      ] = useState(false);
  const [error,              setError             ] = useState("");
  const [errorKey,           setErrorKey          ] = useState(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [formData,           setFormData          ] = useState({ email: "", password: "" });
  const [success,            setSuccess           ] = useState(false);
  const [emailInvalid,       setEmailInvalid      ] = useState(false);
  const [capsLock,           setCapsLock          ] = useState(false);

  // Restore rate-limit countdown from sessionStorage on mount so navigating
  // to /forgot-password and back doesn't reset the remaining wait time.
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

      <form onSubmit={handleSubmit} className="lu-card" style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: 432,
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(15,30,28,0.07)",
        borderRadius: 20, padding: "28px 28px 24px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 2px 4px rgba(0,0,0,.04),0 8px 24px -8px rgba(15,30,28,.10),0 32px 64px -24px rgba(15,30,28,.14),inset 0 1px 0 rgba(255,255,255,.9)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {/* Top edge accent */}
        <div aria-hidden style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,rgba(46,169,142,.5),transparent)", borderRadius: "0 0 4px 4px" }} />

        {/* Success overlay */}
        {success && (
          <div className="lu-success" style={{
            position: "absolute", inset: 0, borderRadius: 20, zIndex: 20,
            background: "rgba(255,255,255,.95)", backdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(31,142,120,.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={28} style={{ color: "#1F8E78" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1714" }}>Signed in successfully</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(15,30,28,.45)" }}>Redirecting to dashboard…</p>
            </div>
          </div>
        )}

        {/* Heading */}
        <div style={{ marginBottom: 4, textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0B1714", letterSpacing: -.3 }}>Welcome back</h2>
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label htmlFor="login-email" style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,30,28,.6)", letterSpacing: ".06em", textTransform: "uppercase" }}>
              Email address
            </label>
            {emailInvalid && (
              <span style={{ fontSize: 11, color: "#C84A1F", fontWeight: 500 }}>Invalid email format</span>
            )}
          </div>
          <AuthInput
            id="login-email" type="email" autoComplete="email" autoFocus
            value={formData.email} disabled={isBusy} invalid={emailInvalid}
            onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (emailInvalid) setEmailInvalid(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { handleEmailBlur(); document.getElementById("login-password")?.focus(); } }}
            placeholder="you@ccquest.com"
            leadingIcon={<Mail size={14} />}
          />
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label htmlFor="login-password" style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,30,28,.6)", letterSpacing: ".06em", textTransform: "uppercase" }}>
              Password
            </label>
            <Link href="/forgot-password" className="lu-link"
              style={{ fontSize: 12, color: "#0F5D4E", textDecoration: "none", fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>
          <AuthInput
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={formData.password} disabled={isBusy}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onKeyDown={handleCapsLock}
            placeholder="••••••••"
            leadingIcon={<Lock size={14} />}
            trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isBusy}
                style={{ background: "transparent", border: 0, color: "rgba(15,30,28,.35)", cursor: "pointer", padding: 4, display: "inline-flex", flexShrink: 0, transition: "color .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.65)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          {capsLock && !showPassword && (
            <div className="lu-caps" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#B87A10" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12M12 12L8 16M12 12L16 16M20 9H4l8-7 8 7z" />
              </svg>
              Caps Lock is on
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(15,30,28,.06)", margin: "2px 0" }} />

        {/* Error */}
        {error && (
          <div key={errorKey} className="lu-error" style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "11px 13px", borderRadius: 10, fontSize: 13,
            border: error === "too_many_requests" ? "1px solid rgba(184,122,16,.28)" : "1px solid rgba(200,74,31,.28)",
            background: error === "too_many_requests" ? "rgba(200,100,30,.06)" : "rgba(200,74,31,.06)",
            color: "#0E1B19",
          }}>
            <svg style={{ flexShrink: 0, marginTop: 1, color: error === "too_many_requests" ? "#B87A10" : "#C84A1F" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              {error === "too_many_requests" ? (
                <>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Too many failed attempts</p>
                  {rateLimitCountdown > 0 && (
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(15,30,28,.55)" }}>
                      Try again in{" "}
                      <strong style={{ color: "#0E1B19", fontVariantNumeric: "tabular-nums" }}>{rateLimitCountdown}s</strong>
                    </p>
                  )}
                </>
              ) : (
                <p style={{ margin: 0 }}>{error}</p>
              )}
            </div>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error"
              style={{ background: "none", border: 0, cursor: "pointer", padding: 2, color: "rgba(15,30,28,.35)", display: "flex", flexShrink: 0, marginTop: -1, transition: "color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isBusy || rateLimitCountdown > 0 || emailInvalid}
          className="lu-btn"
          style={{
            height: 44, borderRadius: 12, border: 0,
            background: "linear-gradient(160deg,#22957D 0%,#0F5D4E 100%)",
            color: "#fff", fontSize: 14, fontWeight: 600, letterSpacing: -.1,
            cursor: isBusy ? "wait" : rateLimitCountdown > 0 || emailInvalid ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 10px 28px -8px rgba(15,93,78,.40),inset 0 1px 0 rgba(255,255,255,.16)",
            opacity: rateLimitCountdown > 0 || emailInvalid ? 0.5 : 1,
            fontFamily: "inherit", marginTop: 2,
            transition: "filter .18s,box-shadow .18s,opacity .15s",
          }}
        >
          {isLoading
            ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /><span>Signing in…</span></>
            : <><span>Sign in</span><ArrowRight size={14} /></>}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F4F8F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <Loader2 size={26} style={{ color: "#1F8E78", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
