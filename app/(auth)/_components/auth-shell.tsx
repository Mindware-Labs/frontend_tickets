import React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const SHELL_CSS = `
  @keyframes auth-scaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes auth-fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .auth-logo   { animation: auth-scaleIn .5s  cubic-bezier(.22,1,.36,1) both; }
  .auth-title  { animation: auth-fadeUp  .55s cubic-bezier(.22,1,.36,1) .08s both; }
  .auth-footer { animation: auth-fadeUp  .6s  cubic-bezier(.22,1,.36,1) .22s both; }
`;

export function AuthShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div
      style={{
        height: "100vh", width: "100%",
        position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 0%,#EEF7F3 0%,#F4F8F5 50%,#F9FAF9 100%)",
        color: "#0E1B19",
        fontFamily: "var(--font-inter,Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between",
        padding: "32px 24px 24px", gap: 16,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />

      {/* Aurora top */}
      <div aria-hidden style={{ position: "absolute", left: "50%", top: "-12%", width: 860, height: 560, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center,rgba(46,169,142,.18) 0%,rgba(46,169,142,.05) 40%,transparent 70%)", filter: "blur(24px)", pointerEvents: "none" }} />
      {/* Bottom glow */}
      <div aria-hidden style={{ position: "absolute", left: "50%", bottom: "-20%", width: 1000, height: 440, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center,rgba(15,93,78,.08) 0%,rgba(15,93,78,.02) 45%,transparent 70%)", filter: "blur(32px)", pointerEvents: "none" }} />
      {/* Top accent line */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(46,169,142,.5) 50%,transparent)" }} />

      {/* Logo */}
      <div className="auth-logo" style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(145deg,#0D1A16 0%,#091310 100%)", border: "1px solid rgba(46,169,142,0.20)", boxShadow: "0 0 0 5px rgba(46,169,142,0.06),0 14px 36px -10px rgba(15,93,78,.38)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Image src="/images/LOGO CQ-12.png" alt="Center Quest" width={56} height={56} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} priority />
        </div>
        <div className="auth-title" style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -.7, fontWeight: 800, background: "linear-gradient(160deg,#0B1714 0%,#1F4038 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Center Quest
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "rgba(15,30,28,.50)", letterSpacing: .05 }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Card slot */}
      {children}

      {/* Footer */}
      <div className="auth-footer" style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 12, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,30,28,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.9)", fontSize: 12.5, color: "rgba(15,30,28,.65)" }}>
          <ShieldCheck size={13} style={{ color: "#1F8E78", flexShrink: 0 }} />
          Restricted to{" "}
          <strong style={{ color: "#0B1714", fontWeight: 700 }}>CCQUEST</strong>
          {" "}&amp;{" "}
          <strong style={{ color: "#0B1714", fontWeight: 700 }}>RIG HUT</strong>
          {" "}personnel only.
        </div>
        <div style={{ fontSize: 11, color: "rgba(15,30,28,.38)" }}>
          Powered by Mindware Labs
        </div>
      </div>
    </div>
  );
}
