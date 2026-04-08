import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create an account on Rig Hut Support Center",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center relative overflow-hidden selection:bg-blue-500/30">
      {/* Fondo Ambiental (Efectos de Luz) */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Grid sutil de fondo */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] pointer-events-none" />

      {/* Contenedor del Formulario */}
      <div className="relative z-10 w-full max-w-md p-4">{children}</div>
    </div>
  );
}
