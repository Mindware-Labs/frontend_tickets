"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";
import { auth } from "@/lib/auth";

// ── Step meta ─────────────────────────────────────────────────────────────────
const STEP_META = {
  request: {
    title: "Forgot password?",
    sub:   "Enter your email and we'll send a 6-digit code to reset it.",
    icon:  KeyRound,
  },
  code: {
    title: "Check your inbox",
    sub:   "Enter the 6-digit code we sent to your email address.",
    icon:  ShieldCheck,
  },
  reset: {
    title: "New password",
    sub:   "Choose a strong password to secure your account.",
    icon:  Lock,
  },
  done: {
    title: "All done!",
    sub:   "Your password has been reset. You can now sign in.",
    icon:  CheckCircle2,
  },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]                         = useState<"request" | "code" | "reset" | "done">("request");
  const [isLoading, setIsLoading]               = useState(false);
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]                       = useState("");
  const [email, setEmail]                       = useState("");
  const [code, setCode]                         = useState("");
  const [password, setPassword]                 = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [resendTimer, setResendTimer]           = useState(0);
  const [isResending, setIsResending]           = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await auth.requestPasswordReset(email.trim().toLowerCase());
      setStep("code");
      setResendTimer(120);
    } catch (err: any) {
      const message = err?.message || "Failed to request reset code.";
      setError(message.toLowerCase().includes("email not found")
        ? "Email not registered. Please check and try again."
        : message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsResending(true);
    try {
      await auth.requestPasswordReset(email.trim().toLowerCase());
      setResendTimer(120);
      setCode("");
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleContinueWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    auth.verifyResetCode(email.trim().toLowerCase(), code.trim())
      .then(() => setStep("reset"))
      .catch((err: any) => setError(err.message || "Invalid or expired code."))
      .finally(() => setIsLoading(false));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters long."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      await auth.resetPasswordWithCode(email.trim().toLowerCase(), code.trim(), password);
      setStep("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const meta = STEP_META[step];
  const StepIcon = meta.icon;

  const inputCls = "h-11 text-[13.5px] bg-muted/50 border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 focus-visible:bg-background transition-all duration-200";

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 sm:p-8">

      {/* ── Background layers - Aircall Green/Teal Theme ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/25 via-teal-500/15 to-emerald-400/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/35 to-slate-950/75" />
      <div className="absolute -top-1/3 -right-1/3 w-[1000px] h-[1000px] rounded-full bg-gradient-to-bl from-emerald-500/20 via-teal-400/10 to-transparent blur-[150px]" />
      <div className="absolute -bottom-1/3 -left-1/3 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-teal-600/18 via-emerald-600/12 to-transparent blur-[140px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-emerald-400/15 to-transparent blur-[110px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_40%,transparent_100%)]" />
      <div className="absolute -top-40 -right-20 w-[800px] h-[1.5px] bg-gradient-to-l from-emerald-400/35 via-teal-400/15 to-transparent rotate-[25deg]" />
      <div className="absolute -bottom-20 -left-20 w-[700px] h-[1.5px] bg-gradient-to-r from-teal-500/25 via-emerald-400/10 to-transparent rotate-[30deg]" />
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", left: "10%",  size: "w-1 h-1",     color: "bg-emerald-400/55", delay: "0ms"    },
          { top: "25%", left: "20%",  size: "w-1.5 h-1.5", color: "bg-teal-400/45",    delay: "1000ms" },
          { top: "40%", left: "85%",  size: "w-1 h-1",     color: "bg-emerald-500/50", delay: "700ms"  },
          { top: "60%", left: "15%",  size: "w-1.5 h-1.5", color: "bg-teal-300/40",    delay: "1500ms" },
          { top: "70%", left: "75%",  size: "w-1 h-1",     color: "bg-emerald-500/45", delay: "300ms"  },
        ].map((p, i) => (
          <div key={i} className={`absolute ${p.size} ${p.color} rounded-full blur-[0.5px] animate-pulse`}
            style={{ top: p.top, left: p.left, animationDelay: p.delay, animationDuration: "3s" }} />
        ))}
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-slate-200/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col md:flex-row min-h-[520px]">

        {/* LEFT - Aircall Green Gradient */}
        <div className="w-full md:w-[45%] relative p-10 lg:p-12 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 bg-gradient-to-br from-white/20 to-transparent blur-[40px]" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-15 bg-gradient-to-tl from-emerald-300/20 to-transparent blur-[48px]" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full opacity-10 bg-gradient-to-r from-emerald-300/30 to-teal-600/20 blur-[32px]" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 400 560" fill="none" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="200" cy="560" rx="340" ry="260" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="200" cy="560" rx="280" ry="200" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="200" cy="560" rx="220" ry="145" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="200" cy="560" rx="160" ry="95"  stroke="white" strokeWidth="1.5"/>
            <ellipse cx="340" cy="-20"  rx="220" ry="170" stroke="white" strokeWidth="1"/>
            <ellipse cx="340" cy="-20"  rx="160" ry="120" stroke="white" strokeWidth="1"/>
          </svg>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border bg-white/10 border-white/20">
              <div className="relative w-full h-full">
                <Image src="/images/LOGO CQ-12.png" alt="Center Quest" fill sizes="40px" className="object-contain scale-125" priority />
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-white text-sm font-bold tracking-tight">Center Quest</p>
              <p className="text-[11px] text-white/45">Tickets system</p>
            </div>
          </div>

          {/* Step-aware content */}
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20 mb-2">
              <StepIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
              {meta.title}
            </h2>
            <p className="text-sm leading-relaxed max-w-[240px] text-white/60">
              {meta.sub}
            </p>
            {/* Step dots */}
            <div className="flex items-center gap-2 pt-2">
              {(["request","code","reset","done"] as const).map((s) => (
                <div key={s} className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: s === step ? "24px" : "6px", background: s === step ? "white" : "rgba(255,255,255,0.25)" }}
                />
              ))}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 transition-all duration-300 hover:bg-white/15">
              <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-widest">Account Recovery</span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[55%] bg-card p-10 lg:p-14 flex flex-col justify-center">

          {/* Mobile logo */}
          <div className="flex md:hidden justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted border border-border relative">
                <Image src="/images/LOGO CQ-12.png" alt="Center Quest" fill sizes="32px" className="object-contain scale-125" priority />
              </div>
              <span className="text-foreground text-sm font-bold">Center Quest</span>
            </div>
          </div>

          {/* ── STEP: request ── */}
          {step === "request" && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Reset password</h1>
              <p className="text-[13px] text-muted-foreground mb-6">We'll email you a 6-digit code to reset your password.</p>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input id="email" type="email" placeholder="Email Address"
                    className={`pl-10 ${inputCls}`} required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button type="submit" disabled={isLoading}
                className="w-full h-11 mt-2 rounded-full text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send Code <ArrowRight className="h-4 w-4" /></>}
              </button>

              <p className="text-[12px] text-center text-muted-foreground pt-1">
                Remembered it?{" "}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">Sign In</Link>
              </p>
            </form>
          )}

          {/* ── STEP: code ── */}
          {step === "code" && (
            <form onSubmit={handleContinueWithCode} className="space-y-5">
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Enter code</h1>
              <p className="text-[13px] text-muted-foreground mb-4">
                Code sent to <span className="text-emerald-600 font-semibold">{email}</span>
              </p>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verification Code</Label>
                <InputOTP value={code} onChange={setCode} maxLength={6} inputMode="numeric" containerClassName="w-full gap-2.5">
                  <InputOTPGroup className="w-full gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i}
                        className="flex-1 h-12 rounded-xl border-border bg-muted/50 text-foreground text-lg font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-w-0" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && <ErrorBox message={error} />}

              <button type="submit" disabled={isLoading}
                className="w-full h-11 rounded-full text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    Resend in <span className="font-bold tabular-nums text-foreground">
                      {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2,"0")}
                    </span>
                  </p>
                ) : (
                  <button type="button" onClick={handleResendCode} disabled={isResending}
                    className="text-[12px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 mx-auto transition-colors">
                    {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP: reset ── */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">New password</h1>
              <p className="text-[13px] text-muted-foreground mb-4">Must be at least 6 characters.</p>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    className={`pl-10 pr-10 ${inputCls}`} required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input id="confirm" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                    className={`pl-10 pr-10 ${inputCls}`} required
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button type="submit" disabled={isLoading}
                className="w-full h-11 mt-2 rounded-full text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* ── STEP: done ── */}
          {step === "done" && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Password updated!</h1>
                <p className="text-[13px] text-muted-foreground mt-2">Redirecting you to sign in…</p>
              </div>
              <button type="button" onClick={() => router.push("/login")}
                className="w-full h-11 rounded-full text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0 bg-emerald-600 hover:bg-emerald-700">
                Go to Sign In <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center mt-8 leading-relaxed">
            System restricted to CCQUEST and RIG HUT authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl border bg-red-50 border-red-200 text-[13px]">
      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-[10px] font-bold">!</span>
      </div>
      <p className="text-red-700">{message}</p>
    </div>
  );
}