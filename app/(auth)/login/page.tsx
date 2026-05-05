"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { auth } from "@/lib/auth";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [isLoading,          setIsLoading         ] = useState(false);
  const [showPassword,       setShowPassword      ] = useState(false);
  const [error,              setError             ] = useState("");
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [rememberMe,         setRememberMe        ] = useState(false);
  const [formData,           setFormData          ] = useState({ email: "", password: "" });

  // Load saved email on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) {
      setFormData((f) => ({ ...f, email: saved }));
      setRememberMe(true);
    }
  }, []);

  // Rate-limit countdown
  React.useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setTimeout(() => setRateLimitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await auth.login(formData.email, formData.password);
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      const redirectParam = searchParams.get("redirect");
      router.push(redirectParam || "/dashboard");
    } catch (err: any) {
      const msg: string = err.message || "Login failed. Please check your credentials.";
      if (msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("throttler")) {
        setRateLimitCountdown(60);
        setError("too_many_requests");
      } else if (msg.includes("Cannot connect to the server")) {
        setError("Unable to connect to the server. Please ensure the backend is running and try again.");
      } else if (msg.includes("fetch")) {
        setError("Network error. Please check your connection and ensure the backend server is running.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 sm:p-8">

      {/* ── BACKGROUND LAYERS - Aircall Green/Teal Theme ──────────────────── */}

      {/* Base gradient - deep teal */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900" />

      {/* Mid-tone wash - Aircall green */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/25 via-teal-500/15 to-emerald-400/20" />

      {/* Depth vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/35 to-slate-950/75" />

      {/* Ambient glow orbs - teal/emerald */}
      <div className="absolute -top-1/3 -right-1/3 w-[1000px] h-[1000px] rounded-full bg-gradient-to-bl from-emerald-500/20 via-teal-400/10 to-transparent blur-[150px]" />
      <div className="absolute -bottom-1/3 -left-1/3 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-teal-600/18 via-emerald-600/12 to-transparent blur-[140px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-emerald-400/15 to-transparent blur-[110px]" />

      {/* Tech grid - Aircall green */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_40%,transparent_100%)]" />

      {/* Light beam diagonals */}
      <div className="absolute -top-40 -right-20 w-[800px] h-[1.5px] bg-gradient-to-l from-emerald-400/35 via-teal-400/15 to-transparent rotate-[25deg]" />
      <div className="absolute -bottom-20 -left-20 w-[700px] h-[1.5px] bg-gradient-to-r from-teal-500/25 via-emerald-400/10 to-transparent rotate-[30deg]" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", left: "10%",  size: "w-1 h-1",     color: "bg-emerald-400/55",  delay: "0ms"    },
          { top: "25%", left: "20%",  size: "w-1.5 h-1.5", color: "bg-teal-400/45",    delay: "1000ms" },
          { top: "40%", left: "85%",  size: "w-1 h-1",     color: "bg-emerald-500/50", delay: "700ms"  },
          { top: "60%", left: "15%",  size: "w-1.5 h-1.5", color: "bg-teal-300/40",    delay: "1500ms" },
          { top: "70%", left: "75%",  size: "w-1 h-1",     color: "bg-emerald-500/45", delay: "300ms"  },
          { top: "80%", left: "40%",  size: "w-1.5 h-1.5", color: "bg-teal-400/35",    delay: "2000ms" },
          { top: "10%", left: "60%",  size: "w-1 h-1",     color: "bg-emerald-400/45", delay: "500ms"  },
          { top: "50%", left: "50%",  size: "w-1 h-1",     color: "bg-teal-400/40",    delay: "1200ms" },
        ].map((p, i) => (
          <div
            key={i}
            className={`absolute ${p.size} ${p.color} rounded-full blur-[0.5px] animate-pulse`}
            style={{ top: p.top, left: p.left, animationDelay: p.delay, animationDuration: "3s" }}
          />
        ))}
      </div>

      {/* ── CARD ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-slate-200/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col md:flex-row min-h-[560px]">

        {/* ══ LEFT COLUMN — Branding (Aircall Green) ════════════════════════ */}
        <div className="w-full md:w-[45%] relative p-10 lg:p-12 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-emerald-600 to-slate-900">

          {/* Ambient glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-15 bg-gradient-to-br from-white/20 to-transparent blur-[40px]" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-10 bg-gradient-to-tl from-emerald-300/15 to-transparent blur-[48px]" />

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* Topographic arcs */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            viewBox="0 0 400 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <ellipse cx="200" cy="560" rx="340" ry="260" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="200" cy="560" rx="280" ry="200" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="200" cy="560" rx="220" ry="145" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="200" cy="560" rx="160" ry="95"  stroke="white" strokeWidth="1.5"/>
            <ellipse cx="340" cy="-20"  rx="220" ry="170" stroke="white" strokeWidth="1"/>
            <ellipse cx="340" cy="-20"  rx="160" ry="120" stroke="white" strokeWidth="1"/>
          </svg>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border bg-white/10 border-white/25">
              <div className="relative w-full h-full">
                <Image
                  src="/images/LOGO CQ-12.png"
                  alt="Center Quest"
                  fill
                  sizes="44px"
                  className="object-contain scale-125"
                  priority
                />
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-white text-base font-extrabold tracking-tight">Center Quest</p>
              <p className="text-[11px] text-white/45">Tickets system</p>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-[1.85rem] font-bold text-white leading-tight tracking-tight">
              Welcome back.<br />
              <span className="text-emerald-200">Let's get to work.</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-[240px] text-white/55">
              Sign in to access your operations.
            </p>
          </div>

          {/* Powered-by badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <span className="text-xs text-white/65 font-medium">Powered by Mindware Labs</span>
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN — Form ═══════════════════════════════════════════ */}
        <div className="w-full md:w-[55%] bg-card p-10 lg:p-14 flex flex-col justify-center">

          {/* Mobile-only logo */}
          <div className="flex md:hidden justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted border border-border relative">
                <Image
                  src="/images/LOGO CQ-10.png"
                  alt="Center Quest"
                  fill
                  sizes="32px"
                  className="object-contain scale-125"
                  priority
                />
              </div>
              <span className="text-foreground text-sm font-bold">Center Quest</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-foreground mb-8 tracking-tight">
            Sign In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
              >
                Work Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/70" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  autoFocus
                  className="
                    pl-10 h-11 text-[13.5px]
                    bg-muted/50 border-border rounded-xl
                    text-foreground placeholder:text-muted-foreground/40
                    shadow-none
                    transition-all duration-200
                    focus-visible:ring-4 focus-visible:ring-emerald-500/20
                    focus-visible:border-emerald-500 focus-visible:bg-background
                  "
                  required
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="
                    pl-10 pr-10 h-11 text-[13.5px]
                    bg-muted/50 border-border rounded-xl
                    text-foreground placeholder:text-muted-foreground/40
                    shadow-none
                    transition-all duration-200
                    focus-visible:ring-4 focus-visible:ring-emerald-500/20
                    focus-visible:border-emerald-500 focus-visible:bg-background
                  "
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400/50 hover:text-muted-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div
                    className="w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all duration-150"
                    style={{
                      borderColor: rememberMe ? "#059669" : "hsl(var(--border))",
                      background:  rememberMe ? "#059669" : "transparent",
                    }}
                  >
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-[13px] ${
                  error === "too_many_requests"
                    ? "bg-warning/10 border-warning/30 dark:bg-warning/5"
                    : "bg-destructive/10 border-destructive/30 dark:bg-destructive/5"
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    error === "too_many_requests" ? "text-warning" : "text-destructive"
                  }`}
                />
                {error === "too_many_requests" ? (
                  <div>
                    <p className="text-foreground font-semibold">Too many failed attempts</p>
                    {rateLimitCountdown > 0 && (
                      <p className="text-muted-foreground text-[12px] mt-0.5">
                        Try again in{" "}
                        <span className="font-bold tabular-nums">{rateLimitCountdown}s</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground">{error}</p>
                )}
              </div>
            )}

            {/* Submit - Aircall Green */}
            <button
              type="submit"
              disabled={isLoading || rateLimitCountdown > 0}
              className="
                w-full h-11 mt-6 rounded-full
                text-white text-[13.5px] font-semibold
                flex items-center justify-center gap-2
                bg-gradient-to-r from-emerald-600 to-teal-500
                shadow-[0_4px_14px_-4px_rgba(5,150,105,0.3)]
                transition-all duration-300 ease-out
                hover:-translate-y-[2px]
                hover:shadow-[0_8px_20px_-6px_rgba(5,150,105,0.4)]
                active:translate-y-0 active:shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_14px_-4px_rgba(5,150,105,0.3)]
              "
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Restriction footer */}
          <p className="text-[10px] text-slate-400/70 text-center mt-6 leading-relaxed">
            System restricted to CCQUEST and RIG HUT authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-emerald-950">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}