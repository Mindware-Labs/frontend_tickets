import Link from 'next/link';
import { BackButton } from '@/components/layout/back-button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {/* Línea de acento superior */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent" />

          <div className="px-8 py-10 text-center">
            {/* Sección label + acento */}
            <div className="mb-6 flex items-center justify-center gap-1.5">
              <div className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Rig Hut Support Center
              </span>
            </div>

            {/* Número 404 */}
            <div className="mb-3 select-none">
              <span className="font-bold tabular-nums leading-none text-[#008f68] text-[72px] tracking-tight opacity-90">
                404
              </span>
            </div>

            {/* Título */}
            <h1 className="mb-2 text-[15px] font-bold tracking-[-0.02em] text-slate-900">
              Page not found
            </h1>

            {/* Descripción */}
            <p className="mb-8 text-sm leading-relaxed text-slate-500">
              The page you are looking for doesn&apos;t exist or has been moved.
              Check the URL or go back to the dashboard.
            </p>

            {/* Acciones */}
            <div className="flex flex-col items-center gap-2.5">
              <Link
                href="/dashboard"
                className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#008f68] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#007a5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25"
              >
                Go to Dashboard
              </Link>
              <BackButton />
            </div>
          </div>

          {/* Footer de la card */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Center Quest &nbsp;·&nbsp; Mindware Labs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
