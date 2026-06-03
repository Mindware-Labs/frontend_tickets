import React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const SHELL_CSS = `
  @keyframes auth-scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes auth-fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .auth-logo   { animation: auth-scaleIn .45s cubic-bezier(.22,1,.36,1) both; }
  .auth-title  { animation: auth-fadeUp  .5s  cubic-bezier(.22,1,.36,1) .07s both; }
  .auth-footer { animation: auth-fadeUp  .55s cubic-bezier(.22,1,.36,1) .20s both; }
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
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#f4f5f7",
        color: "#0f172a",
        fontFamily:
          "var(--font-inter,Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "40px 24px 28px",
        gap: 20,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />

      {/* Subtle aurora top */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "-8%",
          width: 800,
          height: 480,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center,rgba(0,143,104,.10) 0%,rgba(0,143,104,.03) 45%,transparent 70%)",
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />
      {/* Top accent line — DS §5.3 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 1,
          background:
            "linear-gradient(90deg,transparent,rgba(0,143,104,.45) 50%,transparent)",
        }}
      />

      {/* Logo block */}
      <div
        className="auth-logo"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Logo container — light surface with teal accent border */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#ffffff",
            border: "1.5px solid rgba(0,143,104,0.22)",
            boxShadow:
              "0 0 0 5px rgba(0,143,104,0.06),0 8px 24px -8px rgba(0,143,104,0.18)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src="/images/logo-cq-10-mark-transparent.png"
            alt="Center Quest"
            width={84}
            height={84}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        <div className="auth-title" style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              letterSpacing: -0.6,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Center Quest
          </h1>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: 13,
              color: "#64748b",
              letterSpacing: 0.02,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Card slot */}
      {children}

      {/* Footer */}
      <div
        className="auth-footer"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 10,
            background: "#ffffff",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 1px 3px rgba(0,0,0,.04)",
            fontSize: 12,
            color: "#475569",
          }}
        >
          <ShieldCheck size={12} style={{ color: "#008f68", flexShrink: 0 }} />
          Restricted to{" "}
          <strong style={{ color: "#0f172a", fontWeight: 700 }}>CCQUEST</strong>
          {" "}&amp;{" "}
          <strong style={{ color: "#0f172a", fontWeight: 700 }}>RIG HUT</strong>
          {" "}personnel only.
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          Powered by Mindware Labs
        </div>
      </div>
    </div>
  );
}
