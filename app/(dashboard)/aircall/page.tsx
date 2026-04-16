"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

export default function AircallPage() {
  const workspaceRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const AircallWorkspace = (await import("aircall-everywhere")).default;
        if (!mounted) return;
        workspaceRef.current = new AircallWorkspace({
          domToLoadWorkspace: "#aircall-phone-container",
          size: "auto",
          debug: false,
          onLogin: () => {},
          onLogout: () => {},
        });
        if (mounted) setStatus("ready");
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err?.message || "No se pudo cargar el SDK de Aircall");
          setStatus("error");
        }
      }
    })();

    return () => {
      mounted = false;
      workspaceRef.current = null;
    };
  }, []);

  return (
    <div
      className="relative -mx-6 lg:-mx-8 -mt-6"
      style={{ height: "calc(100vh - 88px)" }}
    >
      {/* Overlay de carga */}
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Cargando teléfono Aircall...
          </p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            Error al cargar Aircall
          </p>
          <p className="text-xs text-muted-foreground max-w-sm text-center">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Contenedor del teléfono — el SDK inyecta el iframe aquí */}
      <div
        id="aircall-phone-container"
        className="w-full h-full [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0 [&>iframe]:block"
      />
    </div>
  );
}
