"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { AuthShell } from "../_components/auth-shell";

const PAGE_CSS = `
  @keyframes auth-spin    { to { transform: rotate(360deg); } }
  @keyframes auth-fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes auth-scaleIn { 0%{opacity:0;transform:scale(.90)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }

  .ve-card { animation: auth-fadeUp  .5s  cubic-bezier(.22,1,.36,1) .12s both; }
  .ve-icon { animation: auth-scaleIn .4s  cubic-bezier(.22,1,.36,1) .18s both; }

  .ve-btn {
    transition: background .15s ease, box-shadow .15s ease;
  }
  .ve-btn:hover  { background: #007a5a !important; box-shadow: 0 8px 24px -6px rgba(0,122,90,.40) !important; }
  .ve-btn:active { background: #065f4a !important; }

  .ve-card {
    background: #ffffff;
    border: 1px solid rgba(15,23,42,0.10);
  }
  .ve-divider { background: #f1f5f9; }
  .ve-title { color: #0f172a; }
  .ve-message { color: #64748b; }
  .ve-hint { color: #94a3b8; }
  .ve-fallback { background: #f4f5f7; }
`;

const cardStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: 420,
  borderRadius: 16,
  padding: "32px 28px 28px",
  boxShadow: "0 0 0 1px rgba(0,143,104,0.10),0 8px 32px -8px rgba(0,0,0,.45),0 0 60px -20px rgba(0,143,104,0.10)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
  textAlign: "center",
};

const btnStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 8,
  border: 0,
  background: "#008f68",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontFamily: "inherit",
  width: "100%",
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
};

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

      <div className="ve-card" style={cardStyle}>
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

        {/* Status icon */}
        <div className="ve-icon" style={{ marginTop: 4 }}>
          {status === "loading" && (
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0faf5", border: "1px solid rgba(0,143,104,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={26} style={{ color: "#008f68", animation: "auth-spin 1s linear infinite" }} />
            </div>
          )}
          {status === "success" && (
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0faf5", border: "1px solid rgba(0,143,104,.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={26} style={{ color: "#008f68" }} />
            </div>
          )}
          {status === "error" && (
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fef2f2", border: "1px solid rgba(239,68,68,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={26} style={{ color: "#ef4444" }} />
            </div>
          )}
        </div>

        {/* Title + message */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 className="ve-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>
            {status === "loading" && "Verifying your email…"}
            {status === "success" && "Email verified!"}
            {status === "error"   && "Verification failed"}
          </h2>
          <p className="ve-message" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
            {status === "loading" && !message
              ? "Please wait while we verify your email address…"
              : message}
          </p>
        </div>

        {/* Divider */}
        <div className="ve-divider" style={{ height: 1, width: "100%" }} />

        {/* Actions */}
        {status === "success" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <p className="ve-hint" style={{ margin: 0, fontSize: 12 }}>
              Redirecting to sign in in 3 seconds…
            </p>
            <button onClick={() => router.push("/login")} className="ve-btn" style={btnStyle}>
              <span>Sign in now</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <button onClick={() => router.push("/login")} className="ve-btn" style={btnStyle}>
              <span>Back to sign in</span>
              <ArrowRight size={13} />
            </button>
            <p className="ve-hint" style={{ margin: 0, fontSize: 11 }}>
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
        <div className="ve-fallback" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`@keyframes auth-spin{to{transform:rotate(360deg)}}`}</style>
          <Loader2 size={24} style={{ color: "#008f68", animation: "auth-spin 1s linear infinite" }} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
