"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { AuthShell } from "../_components/auth-shell";

const PAGE_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { 0%{opacity:0;transform:scale(.88)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }

  .ve-card { animation: fadeUp  .6s  cubic-bezier(.22,1,.36,1) .14s both; }
  .ve-icon { animation: scaleIn .45s cubic-bezier(.22,1,.36,1) .2s  both; }

  .ve-btn {
    position: relative; overflow: hidden;
    transition: filter .18s ease, box-shadow .18s ease;
  }
  .ve-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);
    transform: translateX(-100%) skewX(-15deg); transition: none;
  }
  .ve-btn:not(:disabled):hover { filter: brightness(1.08); box-shadow: 0 18px 36px -12px rgba(15,93,78,.50) !important; }
  .ve-btn:not(:disabled):hover::after { transform: translateX(240%) skewX(-15deg); transition: transform .55s ease; }
  .ve-btn:not(:disabled):active { filter: brightness(.96); }
`;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token");

  const [status,  setStatus ] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }
    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        if (!response.ok) throw new Error(responseText || "Verification failed.");
        data = { message: responseText || "Email verified successfully!" };
      }

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setStatus("error");
        const errorMessage =
          (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
          data.error ||
          "Verification failed. The link may be invalid or expired.";
        setMessage(errorMessage);
      }
    } catch (error: any) {
      setStatus("error");
      let errorMessage = "An error occurred during verification. Please try again.";
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Unable to connect to the server. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage(errorMessage);
    }
  };

  return (
    <AuthShell subtitle="Email verification">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <div className="ve-card" style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: 432,
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(15,30,28,0.07)",
        borderRadius: 20, padding: "32px 28px 28px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 2px 4px rgba(0,0,0,.04),0 8px 24px -8px rgba(15,30,28,.10),0 32px 64px -24px rgba(15,30,28,.14),inset 0 1px 0 rgba(255,255,255,.9)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        textAlign: "center",
      }}>
        {/* Top edge accent */}
        <div aria-hidden style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,rgba(46,169,142,.5),transparent)", borderRadius: "0 0 4px 4px" }} />

        {/* Status icon */}
        <div className="ve-icon" style={{ marginTop: 4 }}>
          {status === "loading" && (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(31,142,120,.08)", border: "1px solid rgba(31,142,120,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={28} style={{ color: "#1F8E78", animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {status === "success" && (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(31,142,120,.10)", border: "1px solid rgba(31,142,120,.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={28} style={{ color: "#1F8E78" }} />
            </div>
          )}
          {status === "error" && (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(200,74,31,.08)", border: "1px solid rgba(200,74,31,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={28} style={{ color: "#C84A1F" }} />
            </div>
          )}
        </div>

        {/* Title + message */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0B1714", letterSpacing: -.3 }}>
            {status === "loading" && "Verifying your email…"}
            {status === "success" && "Email verified!"}
            {status === "error"   && "Verification failed"}
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "rgba(15,30,28,.55)", lineHeight: 1.55 }}>
            {status === "loading" && !message
              ? "Please wait while we verify your email address…"
              : message}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(15,30,28,.06)", width: "100%" }} />

        {/* Actions */}
        {status === "success" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(15,30,28,.45)" }}>
              Redirecting to sign in in 3 seconds…
            </p>
            <button
              onClick={() => router.push("/login")}
              className="ve-btn"
              style={{
                height: 44, borderRadius: 12, border: 0,
                background: "linear-gradient(160deg,#22957D 0%,#0F5D4E 100%)",
                color: "#fff", fontSize: 14, fontWeight: 600, letterSpacing: -.1,
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 10px 28px -8px rgba(15,93,78,.40),inset 0 1px 0 rgba(255,255,255,.16)",
                fontFamily: "inherit", width: "100%",
                transition: "filter .18s,box-shadow .18s",
              }}
            >
              <span>Sign in now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <button
              onClick={() => router.push("/login")}
              className="ve-btn"
              style={{
                height: 44, borderRadius: 12, border: 0,
                background: "linear-gradient(160deg,#22957D 0%,#0F5D4E 100%)",
                color: "#fff", fontSize: 14, fontWeight: 600, letterSpacing: -.1,
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 10px 28px -8px rgba(15,93,78,.40),inset 0 1px 0 rgba(255,255,255,.16)",
                fontFamily: "inherit", width: "100%",
                transition: "filter .18s,box-shadow .18s",
              }}
            >
              <span>Back to sign in</span>
              <ArrowRight size={14} />
            </button>
            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(15,30,28,.38)" }}>
              Need help? Contact support.
            </p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#F4F8F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <Loader2 size={26} style={{ color: "#1F8E78", animation: "spin 1s linear infinite" }} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
