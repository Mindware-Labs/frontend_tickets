"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <head>
        <style>{`
          body { margin: 0; }
          @media (prefers-color-scheme: dark) {
            body { background: #020617; color: #f1f5f9; }
            .ge-title { color: #f1f5f9; }
            .ge-message { color: #94a3b8; }
          }
          @media (prefers-color-scheme: light) {
            body { background: #ffffff; color: #0f172a; }
            .ge-title { color: #0f172a; }
            .ge-message { color: #6b7280; }
          }
        `}</style>
      </head>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <h2 className="ge-title text-xl font-semibold">{/* text color via CSS */}Something went wrong</h2>
          <p className="ge-message text-sm">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
