type PlaceholderPageProps = {
  section: string;
  title: string;
  description: string;
};

export function PlaceholderPage({
  section,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {section} · Coming soon
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
