"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes breathe { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes errorIn { 0%{opacity:0;transform:translateY(-6px)} 60%{transform:translateY(2px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes successIn { 0%{opacity:0;transform:scale(.88)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
  @keyframes stepIn  { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }

  .fp-logo   { animation: scaleIn .5s  cubic-bezier(.22,1,.36,1) both; }
  .fp-title  { animation: fadeUp  .55s cubic-bezier(.22,1,.36,1) .08s both; }
  .fp-card   { animation: fadeUp  .6s  cubic-bezier(.22,1,.36,1) .14s both; }
  .fp-footer { animation: fadeUp  .6s  cubic-bezier(.22,1,.36,1) .22s both; }
  .fp-error  { animation: errorIn .3s ease both; }
  .fp-step   { animation: stepIn  .3s cubic-bezier(.22,1,.36,1) both; }
  .fp-done   { animation: successIn .45s cubic-bezier(.22,1,.36,1) both; }

  .fp-btn {
    position:relative; overflow:hidden;
    transition: filter .18s ease, box-shadow .18s ease;
  }
  .fp-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);
    transform:translateX(-100%) skewX(-15deg); transition:none;
  }
  .fp-btn:not(:disabled):hover { filter:brightness(1.08); box-shadow:0 18px 36px -12px rgba(15,93,78,.50) !important; }
  .fp-btn:not(:disabled):hover::after { transform:translateX(240%) skewX(-15deg); transition:transform .55s ease; }
  .fp-btn:not(:disabled):active { filter:brightness(.96); box-shadow:0 4px 12px -6px rgba(15,93,78,.35) !important; }

  .fp-link { position:relative; transition:color .15s ease; }
  .fp-link::after { content:''; position:absolute; left:0; bottom:-1px; right:0; height:1px; background:#0F5D4E; transform:scaleX(0); transform-origin:left; transition:transform .2s ease; }
  .fp-link:hover::after { transform:scaleX(1); }

  .fp-otp-slot {
    flex:1; height:48px; border-radius:10px;
    border:1.5px solid rgba(15,30,28,.10);
    background:#FAFCFB; font-size:18px; font-weight:700;
    color:#0E1B19; text-align:center; outline:none;
    transition:border-color .18s, box-shadow .18s, background .18s;
    min-width:0;
  }
  .fp-otp-slot[data-active=true] {
    border-color:rgba(31,142,120,.65);
    box-shadow:0 0 0 3px rgba(31,142,120,.12),0 1px 3px rgba(0,0,0,.04);
    background:#fff;
  }
`;

/* ─── Input ──────────────────────────────────────────────────────────────── */
function LightInput({
  id, type = "text", value, onChange, placeholder, autoComplete,
  leadingIcon, trailing, autoFocus, disabled, onKeyDown,
}: {
  id?: string; type?: string; value: string; disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string; autoComplete?: string;
  leadingIcon?: React.ReactNode; trailing?: React.ReactNode; autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      background: disabled ? "rgba(15,30,28,.03)" : focus ? "#fff" : "#FAFCFB",
      border:`1.5px solid ${focus ? "rgba(31,142,120,.65)" : "rgba(15,30,28,.10)"}`,
      boxShadow: focus ? "0 0 0 3px rgba(31,142,120,.12),0 1px 3px rgba(0,0,0,.04)" : "0 1px 2px rgba(0,0,0,.03)",
      borderRadius:10, padding:"0 14px", height:46,
      transition:"border-color .18s,box-shadow .18s,background .18s",
      cursor: disabled ? "not-allowed" : "text",
      opacity: disabled ? 0.6 : 1,
    }}>
      {leadingIcon && (
        <span style={{ color: focus ? "rgba(31,142,120,.7)" : "rgba(15,30,28,.35)", display:"inline-flex", flexShrink:0, transition:"color .18s" }}>
          {leadingIcon}
        </span>
      )}
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        autoFocus={autoFocus} disabled={disabled} onKeyDown={onKeyDown}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex:1, border:0, outline:"none", background:"transparent",
          fontFamily:"inherit", fontSize:14, color:"#0E1B19", height:"100%",
          letterSpacing:"-.01em", cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {trailing}
    </div>
  );
}

/* ─── Step dots ──────────────────────────────────────────────────────────── */
const STEPS = ["request","code","reset","done"] as const;
type Step = typeof STEPS[number];

const STEP_META: Record<Step, { title: string; sub: string; icon: React.ElementType }> = {
  request: { title:"Forgot password?",  sub:"Enter your email to receive a 6-digit reset code.", icon: KeyRound    },
  code:    { title:"Check your inbox",  sub:"Enter the code we sent to your email address.",     icon: ShieldCheck  },
  reset:   { title:"New password",      sub:"Choose a strong password to secure your account.",  icon: Lock         },
  done:    { title:"All done!",         sub:"Your password has been reset. Redirecting…",        icon: CheckCircle2 },
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step,                setStep               ] = useState<Step>("request");
  const [isLoading,           setIsLoading          ] = useState(false);
  const [isResending,         setIsResending        ] = useState(false);
  const [showPassword,        setShowPassword       ] = useState(false);
  const [showConfirm,         setShowConfirm        ] = useState(false);
  const [error,               setError              ] = useState("");
  const [errorKey,            setErrorKey           ] = useState(0);
  const [email,               setEmail              ] = useState("");
  const [code,                setCode               ] = useState("");
  const [password,            setPassword           ] = useState("");
  const [confirmPassword,     setConfirmPassword    ] = useState("");
  const [resendTimer,         setResendTimer        ] = useState(0);

  /* Animation clock */
  const [t, setT] = useState(0);
  const rafRef    = useRef<number>(0);
  useEffect(() => {
    const tick = (ts: number) => { setT(ts / 1000); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const showError = (msg: string) => {
    setErrorKey((k) => k + 1);
    setError(msg);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    try {
      await auth.requestPasswordReset(email.trim().toLowerCase());
      setStep("code"); setResendTimer(120);
    } catch (err: any) {
      const m = err?.message || "Failed to request reset code.";
      showError(m.toLowerCase().includes("email not found")
        ? "Email not registered. Please check and try again." : m);
    } finally { setIsLoading(false); }
  };

  const handleResendCode = async () => {
    setIsResending(true); setError("");
    try {
      await auth.requestPasswordReset(email.trim().toLowerCase());
      setResendTimer(120); setCode("");
    } catch (err: any) {
      showError(err?.message || "Failed to resend code.");
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

  const wavePath = useCallback((k: number) => {
    const N = 80, W = 440, H = 120;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W;
      const y = H / 2 + Math.sin(i * 0.18 + t * (1 + k * 0.3) + k) * (10 + k * 4);
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [t]);

  const meta    = STEP_META[step];
  const StepIcon = meta.icon;

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{
      height:"100vh", width:"100%",
      position:"relative", overflow:"hidden",
      background:"radial-gradient(ellipse at 50% 0%,#EEF7F3 0%,#F4F8F5 50%,#F9FAF9 100%)",
      color:"#0E1B19",
      fontFamily:"var(--font-inter,Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif)",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"space-between",
      padding:"32px 24px 24px", gap:16,
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {/* Aurora top */}
      <div aria-hidden style={{ position:"absolute", left:"50%", top:"-12%", width:860, height:560, transform:"translateX(-50%)", background:"radial-gradient(ellipse at center,rgba(46,169,142,.18) 0%,rgba(46,169,142,.05) 40%,transparent 70%)", filter:"blur(24px)", pointerEvents:"none" }}/>
      {/* Bottom glow */}
      <div aria-hidden style={{ position:"absolute", left:"50%", bottom:"-20%", width:1000, height:440, transform:"translateX(-50%)", background:"radial-gradient(ellipse at center,rgba(15,93,78,.08) 0%,rgba(15,93,78,.02) 45%,transparent 70%)", filter:"blur(32px)", pointerEvents:"none" }}/>
      {/* Top line */}
      <div aria-hidden style={{ position:"absolute", left:0, right:0, top:0, height:1, background:"linear-gradient(90deg,transparent,rgba(46,169,142,.5) 50%,transparent)" }}/>

      {/* Signal waves */}
      <svg viewBox="0 0 440 120" preserveAspectRatio="xMidYMid meet" aria-hidden style={{ position:"absolute", top:66, left:"50%", transform:"translateX(-50%)", width:"min(440px,100%)", height:120, opacity:.45, pointerEvents:"none" }}>
        <defs>
          <linearGradient id="lw" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(46,169,142,0)"/>
            <stop offset="0.5" stopColor="rgba(46,169,142,0.6)"/>
            <stop offset="1" stopColor="rgba(46,169,142,0)"/>
          </linearGradient>
        </defs>
        {[0,1,2].map((k) => (
          <path key={k} d={wavePath(k)} stroke="url(#lw)" strokeWidth={1+k*.4} fill="none" opacity={.55-k*.12}/>
        ))}
      </svg>

      {/* ════ LOGO ════ */}
      <div className="fp-logo" style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:12, paddingTop:0 }}>
        <div style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(145deg,#0D1A16 0%,#091310 100%)", border:"1px solid rgba(46,169,142,0.20)", boxShadow:"0 0 0 5px rgba(46,169,142,0.06),0 14px 36px -10px rgba(15,93,78,.38)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/LOGO CQ-12.png" alt="Center Quest" style={{ width:56, height:56, objectFit:"contain", filter:"brightness(0) invert(1)" }}/>
        </div>
        <div className="fp-title" style={{ textAlign:"center" }}>
          <h1 style={{ margin:0, fontSize:28, letterSpacing:-.7, fontWeight:800, background:"linear-gradient(160deg,#0B1714 0%,#1F4038 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Center Quest
          </h1>
          <p style={{ margin:"6px 0 0", fontSize:13.5, color:"rgba(15,30,28,.50)", letterSpacing:.05 }}>
            Account recovery
          </p>
        </div>
      </div>

      {/* ════ FORM CARD ════ */}
      <div className="fp-card" style={{
        position:"relative", zIndex:10, width:"100%", maxWidth:432,
        background:"rgba(255,255,255,0.82)",
        border:"1px solid rgba(15,30,28,0.07)",
        borderRadius:20, padding:"28px 28px 24px",
        backdropFilter:"blur(16px)",
        boxShadow:"0 2px 4px rgba(0,0,0,.04),0 8px 24px -8px rgba(15,30,28,.10),0 32px 64px -24px rgba(15,30,28,.14),inset 0 1px 0 rgba(255,255,255,.9)",
        display:"flex", flexDirection:"column", gap:14,
      }}>
        {/* Top edge accent */}
        <div aria-hidden style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(46,169,142,.5),transparent)", borderRadius:"0 0 4px 4px" }}/>

        {/* Step indicator */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"rgba(31,142,120,.10)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              <StepIcon size={15} style={{ color:"#1F8E78" }}/>
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0B1714", letterSpacing:-.3 }}>{meta.title}</h2>
              <p style={{ margin:0, fontSize:11.5, color:"rgba(15,30,28,.45)", marginTop:1 }}>{meta.sub}</p>
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
            {STEPS.filter(s => s !== "done").map((s) => (
              <div key={s} style={{
                height:5, borderRadius:99, transition:"all .3s ease",
                width: s === step ? 18 : 5,
                background: s === step ? "#1F8E78" : STEPS.indexOf(s) < STEPS.indexOf(step) ? "rgba(31,142,120,.4)" : "rgba(15,30,28,.12)",
              }}/>
            ))}
          </div>
        </div>

        <div style={{ height:1, background:"rgba(15,30,28,.06)" }}/>

        {/* ── STEP: request ── */}
        {step === "request" && (
          <form key="request" className="fp-step" onSubmit={handleRequestCode} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label htmlFor="fp-email" style={{ fontSize:12, fontWeight:600, color:"rgba(15,30,28,.6)", letterSpacing:".06em", textTransform:"uppercase" }}>
                Email address
              </label>
              <LightInput
                id="fp-email" type="email" autoComplete="email" autoFocus
                value={email} disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ccquest.com"
                leadingIcon={<Mail size={14}/>}
              />
            </div>

            {error && <ErrorBanner key={errorKey} message={error} onDismiss={() => setError("")}/>}

            <button type="submit" disabled={isLoading || !email.trim()} className="fp-btn" style={btnStyle(isLoading || !email.trim())}>
              {isLoading
                ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/><span>Sending…</span></>
                : <><span>Send Code</span><ArrowRight size={14}/></>}
            </button>

            <p style={{ textAlign:"center", fontSize:12.5, color:"rgba(15,30,28,.5)", margin:0 }}>
              Remembered it?{" "}
              <Link href="/login" className="fp-link" style={{ color:"#0F5D4E", textDecoration:"none", fontWeight:600 }}>
                Sign in
              </Link>
            </p>
          </form>
        )}

        {/* ── STEP: code ── */}
        {step === "code" && (
          <form key="code" className="fp-step" onSubmit={handleVerifyCode} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <p style={{ margin:0, fontSize:13, color:"rgba(15,30,28,.55)" }}>
              Code sent to{" "}
              <strong style={{ color:"#0B1714", fontWeight:600 }}>{email}</strong>
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"rgba(15,30,28,.6)", letterSpacing:".06em", textTransform:"uppercase" }}>
                Verification Code
              </label>
              <InputOTP value={code} onChange={setCode} maxLength={6} inputMode="numeric"
                containerClassName="w-full gap-2">
                <InputOTPGroup className="w-full gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i}
                      className="fp-otp-slot flex-1 h-12 rounded-[10px] border-[1.5px] border-[rgba(15,30,28,0.10)] bg-[#FAFCFB] text-[18px] font-bold text-[#0E1B19] text-center outline-none transition-all duration-200 min-w-0 focus:border-[rgba(31,142,120,0.65)] focus:shadow-[0_0_0_3px_rgba(31,142,120,0.12)]"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <ErrorBanner key={errorKey} message={error} onDismiss={() => setError("")}/>}

            <button type="submit" disabled={isLoading || code.length !== 6} className="fp-btn" style={btnStyle(isLoading || code.length !== 6)}>
              {isLoading
                ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/><span>Verifying…</span></>
                : <><span>Continue</span><ArrowRight size={14}/></>}
            </button>

            <div style={{ textAlign:"center" }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize:12, color:"rgba(15,30,28,.5)", margin:0 }}>
                  Resend in{" "}
                  <strong style={{ color:"#0B1714", fontVariantNumeric:"tabular-nums" }}>
                    {Math.floor(resendTimer/60)}:{(resendTimer%60).toString().padStart(2,"0")}
                  </strong>
                </p>
              ) : (
                <button type="button" onClick={handleResendCode} disabled={isResending}
                  style={{ background:"none", border:0, cursor:"pointer", fontSize:12.5, color:"#0F5D4E", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, padding:0, fontFamily:"inherit" }}>
                  {isResending ? <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }}/> : <RefreshCw size={12}/>}
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP: reset ── */}
        {step === "reset" && (
          <form key="reset" className="fp-step" onSubmit={handleResetPassword} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label htmlFor="fp-password" style={{ fontSize:12, fontWeight:600, color:"rgba(15,30,28,.6)", letterSpacing:".06em", textTransform:"uppercase" }}>
                New Password
              </label>
              <LightInput
                id="fp-password" type={showPassword ? "text" : "password"}
                autoComplete="new-password" autoFocus
                value={password} disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leadingIcon={<Lock size={14}/>}
                trailing={
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ background:"transparent", border:0, color:"rgba(15,30,28,.35)", cursor:"pointer", padding:4, display:"inline-flex", flexShrink:0, transition:"color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.65)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
                  >
                    {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                }
              />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label htmlFor="fp-confirm" style={{ fontSize:12, fontWeight:600, color:"rgba(15,30,28,.6)", letterSpacing:".06em", textTransform:"uppercase" }}>
                Confirm Password
              </label>
              <LightInput
                id="fp-confirm" type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword} disabled={isLoading}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                leadingIcon={<Lock size={14}/>}
                trailing={
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    style={{ background:"transparent", border:0, color:"rgba(15,30,28,.35)", cursor:"pointer", padding:4, display:"inline-flex", flexShrink:0, transition:"color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.65)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
                  >
                    {showConfirm ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                }
              />
            </div>

            {error && <ErrorBanner key={errorKey} message={error} onDismiss={() => setError("")}/>}

            <button type="submit" disabled={isLoading || !password || !confirmPassword} className="fp-btn" style={btnStyle(isLoading || !password || !confirmPassword)}>
              {isLoading
                ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/><span>Resetting…</span></>
                : <><span>Reset Password</span><ArrowRight size={14}/></>}
            </button>
          </form>
        )}

        {/* ── STEP: done ── */}
        {step === "done" && (
          <div key="done" className="fp-done" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"8px 0 4px", textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(31,142,120,.10)", border:"1px solid rgba(31,142,120,.20)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CheckCircle2 size={28} style={{ color:"#1F8E78" }}/>
            </div>
            <div>
              <p style={{ margin:0, fontSize:16, fontWeight:700, color:"#0B1714" }}>Password updated!</p>
              <p style={{ margin:"5px 0 0", fontSize:13, color:"rgba(15,30,28,.45)" }}>Redirecting you to sign in…</p>
            </div>
            <button type="button" onClick={() => router.push("/login")} className="fp-btn" style={{ ...btnStyle(false), width:"100%" }}>
              <span>Go to Sign In</span><ArrowRight size={14}/>
            </button>
          </div>
        )}
      </div>

      {/* ════ FOOTER ════ */}
      <div className="fp-footer" style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"10px 18px", borderRadius:12, background:"rgba(255,255,255,0.72)", border:"1px solid rgba(15,30,28,0.07)", boxShadow:"0 1px 3px rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.9)", fontSize:12.5, color:"rgba(15,30,28,.65)" }}>
          <ShieldCheck size={13} style={{ color:"#1F8E78", flexShrink:0 }}/>
          Restricted to{" "}
          <strong style={{ color:"#0B1714", fontWeight:700 }}>CCQUEST</strong>
          {" "}&amp;{" "}
          <strong style={{ color:"#0B1714", fontWeight:700 }}>RIG HUT</strong>
          {" "}personnel only.
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16, fontSize:11, color:"rgba(15,30,28,.38)", flexWrap:"wrap", justifyContent:"center" }}>
          <span>Powered by Mindware Labs</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────────────────── */
function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    height:46, borderRadius:10, border:0,
    background:"linear-gradient(160deg,#22957D 0%,#0F5D4E 100%)",
    color:"#fff", fontSize:14, fontWeight:600, letterSpacing:-.1,
    cursor: disabled ? "not-allowed" : "pointer",
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    boxShadow:"0 10px 28px -8px rgba(15,93,78,.40),inset 0 1px 0 rgba(255,255,255,.16)",
    opacity: disabled ? 0.5 : 1,
    fontFamily:"inherit",
    transition:"filter .18s,box-shadow .18s,opacity .15s",
    width:"100%",
  };
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fp-error" style={{
      display:"flex", alignItems:"flex-start", gap:10,
      padding:"11px 13px", borderRadius:10, fontSize:13,
      border:"1px solid rgba(200,74,31,.28)",
      background:"rgba(200,74,31,.06)",
      color:"#0E1B19", position:"relative",
    }}>
      <svg style={{ flexShrink:0, marginTop:1, color:"#C84A1F" }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ margin:0, flex:1 }}>{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error"
        style={{ background:"none", border:0, cursor:"pointer", padding:2, color:"rgba(15,30,28,.35)", display:"flex", flexShrink:0, marginTop:-1, transition:"color .15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.7)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
      >
        <X size={13}/>
      </button>
    </div>
  );
}
