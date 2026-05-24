"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Loader2, ArrowRight,
  Lock, Mail, ShieldCheck, X, CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/auth";

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes breathe { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes errorIn { 0%{opacity:0;transform:translateY(-6px)} 60%{transform:translateY(2px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes successIn { 0%{opacity:0;transform:scale(.88)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
  @keyframes capsIn  { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

  .lu-logo   { animation: scaleIn .5s  cubic-bezier(.22,1,.36,1) both; }
  .lu-title  { animation: fadeUp  .55s cubic-bezier(.22,1,.36,1) .08s both; }
  .lu-card   { animation: fadeUp  .6s  cubic-bezier(.22,1,.36,1) .14s both; }
  .lu-footer { animation: fadeUp  .6s  cubic-bezier(.22,1,.36,1) .22s both; }
  .lu-error  { animation: errorIn .3s ease both; }
  .lu-caps   { animation: capsIn  .22s ease both; }
  .lu-success{ animation: successIn .45s cubic-bezier(.22,1,.36,1) both; }

  .lu-btn {
    position:relative; overflow:hidden;
    transition: filter .18s ease, box-shadow .18s ease;
  }
  .lu-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);
    transform:translateX(-100%) skewX(-15deg); transition:none;
  }
  .lu-btn:not(:disabled):hover { filter:brightness(1.08); box-shadow:0 18px 36px -12px rgba(15,93,78,.50) !important; }
  .lu-btn:not(:disabled):hover::after { transform:translateX(240%) skewX(-15deg); transition:transform .55s ease; }
  .lu-btn:not(:disabled):active { filter:brightness(.96); box-shadow:0 4px 12px -6px rgba(15,93,78,.35) !important; }

  .lu-link { position:relative; transition:color .15s ease; }
  .lu-link::after { content:''; position:absolute; left:0; bottom:-1px; right:0; height:1px; background:#0F5D4E; transform:scaleX(0); transform-origin:left; transition:transform .2s ease; }
  .lu-link:hover::after { transform:scaleX(1); }

  .lu-field-invalid { border-color: rgba(200,74,31,.55) !important; }
  .lu-field-invalid:focus-within { box-shadow: 0 0 0 3px rgba(200,74,31,.12), 0 1px 3px rgba(0,0,0,.04) !important; }
`;

/* ─── Input ──────────────────────────────────────────────────────────────── */
function LightInput({
  id, type = "text", value, onChange, placeholder, autoComplete,
  leadingIcon, trailing, autoFocus, disabled, invalid,
  onKeyDown,
}: {
  id?: string; type?: string; value: string; disabled?: boolean; invalid?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string; autoComplete?: string;
  leadingIcon?: React.ReactNode; trailing?: React.ReactNode; autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);

  return (
    <div
      className={invalid && !focus ? "lu-field-invalid" : ""}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: disabled ? "rgba(15,30,28,.03)" : focus ? "#fff" : "#FAFCFB",
        border: `1.5px solid ${invalid && !focus ? "rgba(200,74,31,.45)" : focus ? "rgba(31,142,120,.65)" : "rgba(15,30,28,.10)"}`,
        boxShadow: focus
          ? "0 0 0 3px rgba(31,142,120,.12),0 1px 3px rgba(0,0,0,.04)"
          : "0 1px 2px rgba(0,0,0,.03)",
        borderRadius: 10, padding: "0 14px", height: 46,
        transition: "border-color .18s,box-shadow .18s,background .18s",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.6 : 1,
      }}>
      {leadingIcon && (
        <span style={{
          color: invalid && !focus ? "rgba(200,74,31,.6)" : focus ? "rgba(31,142,120,.7)" : "rgba(15,30,28,.35)",
          display: "inline-flex", flexShrink: 0, transition: "color .18s",
        }}>
          {leadingIcon}
        </span>
      )}
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        autoFocus={autoFocus} disabled={disabled} onKeyDown={onKeyDown}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: 0, outline: "none", background: "transparent",
          fontFamily: "inherit", fontSize: 14, color: "#0E1B19", height: "100%",
          letterSpacing: "-.01em", cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {trailing}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [isLoading,          setIsLoading         ] = useState(false);
  const [showPassword,       setShowPassword      ] = useState(false);
  const [error,              setError             ] = useState("");
  const [errorKey,           setErrorKey          ] = useState(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [rememberMe,         setRememberMe        ] = useState(false);
  const [formData,           setFormData          ] = useState({ email: "", password: "" });
  const [success,            setSuccess           ] = useState(false);
  const [emailInvalid,       setEmailInvalid      ] = useState(false);
  const [capsLock,           setCapsLock          ] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  /* Animation clock */
  const [t, setT] = useState(0);
  const rafRef    = useRef<number>(0);
  useEffect(() => {
    const tick = (ts: number) => { setT(ts / 1000); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) { setFormData((f) => ({ ...f, email: saved })); setRememberMe(true); }
  }, []);

  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setTimeout(() => setRateLimitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  /* Caps Lock detection */
  const handleCapsLock = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  /* Email blur validation */
  const handleEmailBlur = () => {
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailInvalid(true);
    } else {
      setEmailInvalid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInvalid) return;
    setIsLoading(true);
    setError("");
    try {
      await auth.login(formData.email, formData.password);
      if (rememberMe) localStorage.setItem("rememberedEmail", formData.email);
      else            localStorage.removeItem("rememberedEmail");
      setSuccess(true);
      setTimeout(() => {
        const redirect = searchParams.get("redirect");
        router.push(redirect || "/dashboard");
      }, 900);
    } catch (err: any) {
      const msg: string = err.message || "Login failed. Please check your credentials.";
      setErrorKey((k) => k + 1);
      if (msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("throttler")) {
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

  const isBusy = isLoading || success;

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{
      height: "100vh", width: "100%",
      position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 0%,#EEF7F3 0%,#F4F8F5 50%,#F9FAF9 100%)",
      color: "#0E1B19",
      fontFamily: "var(--font-inter,Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "space-between",
      padding: "32px 24px 24px", gap: 16,
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {/* Aurora top */}
      <div aria-hidden style={{ position:"absolute", left:"50%", top:"-12%", width:860, height:560, transform:"translateX(-50%)", background:"radial-gradient(ellipse at center,rgba(46,169,142,.18) 0%,rgba(46,169,142,.05) 40%,transparent 70%)", filter:"blur(24px)", pointerEvents:"none" }}/>
      {/* Bottom glow */}
      <div aria-hidden style={{ position:"absolute", left:"50%", bottom:"-20%", width:1000, height:440, transform:"translateX(-50%)", background:"radial-gradient(ellipse at center,rgba(15,93,78,.08) 0%,rgba(15,93,78,.02) 45%,transparent 70%)", filter:"blur(32px)", pointerEvents:"none" }}/>
      {/* Top line */}
      <div aria-hidden style={{ position:"absolute", left:0, right:0, top:0, height:1, background:"linear-gradient(90deg,transparent,rgba(46,169,142,.5) 50%,transparent)" }}/>

      

      {/* ════ LOGO ════ */}
      <div className="lu-logo" style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:12, paddingTop:0 }}>
        <div style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(145deg,#0D1A16 0%,#091310 100%)", border:"1px solid rgba(46,169,142,0.20)", boxShadow:"0 0 0 5px rgba(46,169,142,0.06),0 14px 36px -10px rgba(15,93,78,.38)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/LOGO CQ-12.png" alt="Center Quest" style={{ width:56, height:56, objectFit:"contain", filter:"brightness(0) invert(1)" }}/>
        </div>
        <div className="lu-title" style={{ textAlign:"center" }}>
          <h1 style={{ margin:0, fontSize:28, letterSpacing:-.7, fontWeight:800, background:"linear-gradient(160deg,#0B1714 0%,#1F4038 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Center Quest
          </h1>
          <p style={{ margin:"6px 0 0", fontSize:13.5, color:"rgba(15,30,28,.50)", letterSpacing:.05 }}>
            Sign in to your operations workspace
          </p>
        </div>
      </div>

      {/* ════ FORM CARD ════ */}
      <form onSubmit={handleSubmit} className="lu-card" style={{
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

        {/* Success overlay */}
        {success && (
          <div className="lu-success" style={{
            position:"absolute", inset:0, borderRadius:20, zIndex:20,
            background:"rgba(255,255,255,.95)", backdropFilter:"blur(8px)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12,
          }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(31,142,120,.10)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CheckCircle2 size={28} style={{ color:"#1F8E78" }}/>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#0B1714" }}>Signed in successfully</p>
              <p style={{ margin:"4px 0 0", fontSize:12.5, color:"rgba(15,30,28,.45)" }}>Redirecting to dashboard…</p>
            </div>
          </div>
        )}

        {/* Card heading */}
        <div style={{ marginBottom:4, textAlign:"center" }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0B1714", letterSpacing:-.3 }}>Welcome back</h2>
        </div>

        {/* Email */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <label htmlFor="login-email" style={{ fontSize:12, fontWeight:600, color:"rgba(15,30,28,.6)", letterSpacing:".06em", textTransform:"uppercase" }}>
              Email address
            </label>
            {emailInvalid && (
              <span style={{ fontSize:11, color:"#C84A1F", fontWeight:500 }}>Invalid email format</span>
            )}
          </div>
          <LightInput
            id="login-email" type="email" autoComplete="email" autoFocus
            value={formData.email} disabled={isBusy} invalid={emailInvalid}
            onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (emailInvalid) setEmailInvalid(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { handleEmailBlur(); document.getElementById("login-password")?.focus(); } }}
            placeholder="you@ccquest.com"
            leadingIcon={<Mail size={14}/>}
          />
        </div>

        {/* Password */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <label htmlFor="login-password" style={{ fontSize:12, fontWeight:600, color:"rgba(15,30,28,.6)", letterSpacing:".06em", textTransform:"uppercase" }}>
              Password
            </label>
            <Link href="/forgot-password" className="lu-link"
              style={{ fontSize:12, color:"#0F5D4E", textDecoration:"none", fontWeight:600 }}>
              Forgot password?
            </Link>
          </div>
          <LightInput
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={formData.password} disabled={isBusy}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onKeyDown={handleCapsLock}
            placeholder="••••••••"
            leadingIcon={<Lock size={14}/>}
            trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isBusy}
                style={{ background:"transparent", border:0, color:"rgba(15,30,28,.35)", cursor:"pointer", padding:4, display:"inline-flex", flexShrink:0, transition:"color .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.65)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
              >
                {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            }
          />
          {/* Caps Lock warning */}
          {capsLock && !showPassword && (
            <div className="lu-caps" style={{ display:"flex", alignItems:"center", gap:6, fontSize:11.5, color:"#B87A10" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12M12 12L8 16M12 12L16 16M20 9H4l8-7 8 7z"/>
              </svg>
              Caps Lock is on
            </div>
          )}
        </div>

        {/* Remember me */}
        <label style={{ display:"inline-flex", alignItems:"center", gap:8, cursor: isBusy ? "not-allowed" : "pointer", userSelect:"none", marginTop:2, opacity: isBusy ? 0.6 : 1 }}>
          <span style={{
            width:16, height:16, borderRadius:4, flexShrink:0,
            border:`1.5px solid ${rememberMe ? "#1F8E78" : "rgba(15,30,28,.18)"}`,
            background: rememberMe ? "#1F8E78" : "#fff",
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            transition:"background .15s,border-color .15s,box-shadow .15s",
            boxShadow: rememberMe ? "0 0 0 3px rgba(31,142,120,.12)" : "none",
          }}>
            {rememberMe && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2l2.3 2.3L9.5 3.7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <input type="checkbox" checked={rememberMe} onChange={(e) => !isBusy && setRememberMe(e.target.checked)}
            style={{ position:"absolute", opacity:0, width:0, height:0 }}/>
          <span style={{ fontSize:13, color:"rgba(15,30,28,.6)", fontWeight:500 }}>Remember me</span>
        </label>

        {/* Divider */}
        <div style={{ height:1, background:"rgba(15,30,28,.06)", margin:"2px 0" }}/>

        {/* Error */}
        {error && (
          <div key={errorKey} className="lu-error" style={{
            display:"flex", alignItems:"flex-start", gap:10,
            padding:"11px 13px", borderRadius:10, fontSize:13,
            border: error === "too_many_requests" ? "1px solid rgba(184,122,16,.28)" : "1px solid rgba(200,74,31,.28)",
            background: error === "too_many_requests" ? "rgba(200,100,30,.06)" : "rgba(200,74,31,.06)",
            color:"#0E1B19", position:"relative",
          }}>
            <svg style={{ flexShrink:0, marginTop:1, color: error === "too_many_requests" ? "#B87A10" : "#C84A1F" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div style={{ flex:1 }}>
              {error === "too_many_requests" ? (
                <>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>Too many failed attempts</p>
                  {rateLimitCountdown > 0 && (
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"rgba(15,30,28,.55)" }}>
                      Try again in{" "}
                      <strong style={{ color:"#0E1B19", fontVariantNumeric:"tabular-nums" }}>{rateLimitCountdown}s</strong>
                    </p>
                  )}
                </>
              ) : (
                <p style={{ margin:0 }}>{error}</p>
              )}
            </div>
            {/* Dismiss */}
            <button type="button" onClick={() => setError("")}
              aria-label="Dismiss error"
              style={{ background:"none", border:0, cursor:"pointer", padding:2, color:"rgba(15,30,28,.35)", display:"flex", flexShrink:0, marginTop:-1, transition:"color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,30,28,.35)")}
            >
              <X size={13}/>
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isBusy || rateLimitCountdown > 0 || emailInvalid}
          className="lu-btn"
          style={{
            height:46, borderRadius:10, border:0,
            background:"linear-gradient(160deg,#22957D 0%,#0F5D4E 100%)",
            color:"#fff", fontSize:14, fontWeight:600, letterSpacing:-.1,
            cursor: isBusy ? "wait" : rateLimitCountdown > 0 || emailInvalid ? "not-allowed" : "pointer",
            display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow:"0 10px 28px -8px rgba(15,93,78,.40),inset 0 1px 0 rgba(255,255,255,.16)",
            opacity: rateLimitCountdown > 0 || emailInvalid ? 0.5 : 1,
            fontFamily:"inherit", marginTop:2,
            transition:"filter .18s,box-shadow .18s,opacity .15s",
          }}
        >
          {isLoading
            ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/><span>Signing in…</span></>
            : <><span>Sign in</span><ArrowRight size={14}/></>}
        </button>
      </form>

      {/* ════ FOOTER ════ */}
      <div className="lu-footer" style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", background:"#F4F8F5", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <Loader2 size={26} style={{ color:"#1F8E78", animation:"spin 1s linear infinite" }}/>
      </div>
    }>
      <LoginForm/>
    </Suspense>
  );
}
