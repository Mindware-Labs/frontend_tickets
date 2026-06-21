"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EntityFormField,
  entityFormInputClassName,
} from "@/components/forms/entity-form-layout";
import { appPanelClass, topbarAccentLineClass } from "@/components/layout/sidebar-theme";
import { settingsApi } from "@/lib/settings-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FieldKey = "current" | "next" | "confirm";

const PASSWORD_RULES: { id: string; label: string; test: (v: string) => boolean }[] = [
  { id: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
];

const STRENGTH_META = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-sky-500", text: "text-sky-600" },
  { label: "Strong", bar: "bg-[#008f68]", text: "text-[#008f68]" },
];

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
  invalid,
  autoFocus,
  onEnter,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
  invalid?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        className={cn(
          entityFormInputClassName,
          "pl-8 pr-9",
          invalid &&
            "border-red-300 focus:border-red-400 focus:ring-red-400/20",
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-neutral-800"
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Verify identity" },
    { n: 2, label: "New password" },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold ring-1 transition-colors",
                done
                  ? "bg-[#008f68] text-white ring-[#008f68]"
                  : active
                    ? "bg-[#f0faf5] text-[#008f68] ring-[#008f68]/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-400 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-500 dark:ring-neutral-700",
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : s.n}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider",
                active || done
                  ? "text-slate-700 dark:text-neutral-200"
                  : "text-slate-400",
              )}
            >
              {s.label}
            </span>
            {i === 0 ? (
              <ArrowRight className="size-3 text-slate-300" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ChangePasswordCard() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<FieldKey, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });

  const toggle = (key: FieldKey) =>
    setVisible((v) => ({ ...v, [key]: !v[key] }));

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(next) })),
    [next],
  );
  const metCount = ruleResults.filter((r) => r.ok).length;
  const allRulesMet = metCount === PASSWORD_RULES.length;
  const strength = STRENGTH_META[next ? metCount : 0];

  const confirmMismatch = confirm.length > 0 && confirm !== next;
  const sameAsCurrent =
    next.length > 0 && current.length > 0 && next === current;

  const canSubmit =
    !saving &&
    allRulesMet &&
    next.length > 0 &&
    next === confirm &&
    !sameAsCurrent;

  const resetAll = () => {
    setStep(1);
    setCurrent("");
    setNext("");
    setConfirm("");
    setCurrentError(null);
    setVisible({ current: false, next: false, confirm: false });
  };

  const handleVerify = async () => {
    if (!current || verifying) return;
    setVerifying(true);
    setCurrentError(null);
    try {
      await settingsApi.verifyCurrentPassword({ password: current });
      setStep(2);
    } catch (error: any) {
      const message = error?.message || "Current password is incorrect";
      setCurrentError(message);
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSaving(true);
      await settingsApi.changePassword({
        currentPassword: current,
        newPassword: next,
      });
      resetAll();
      toast({
        title: "Password updated",
        description: "Your password was changed successfully.",
      });
    } catch (error: any) {
      const message = error?.message || "Please try again.";
      toast({
        title: "Could not change password",
        description: message,
        variant: "destructive",
      });
      // If the current password became invalid, send the user back to step 1.
      if (/current password/i.test(message)) {
        setCurrentError(message);
        setStep(1);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={cn(appPanelClass, "relative flex min-w-0 flex-col")}>
      <span className={topbarAccentLineClass} aria-hidden />
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-neutral-500">
              Security
            </p>
            <h2 className="truncate text-[15px] font-bold leading-tight text-slate-900 dark:text-neutral-100">
              Change password
            </h2>
          </div>
        </div>
        <Stepper step={step} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 bg-[#f4f5f7] p-2.5 dark:bg-neutral-950"
      >
        {step === 1 ? (
          /* ── Step 1: verify current password ── */
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-neutral-500">
              Step 1 · Confirm it's you
            </p>
            <div className="max-w-md">
              <EntityFormField
                id="currentPassword"
                label="Current password"
                hint="Enter your current password to continue."
              >
                <PasswordInput
                  id="currentPassword"
                  value={current}
                  onChange={(v) => {
                    setCurrent(v);
                    if (currentError) setCurrentError(null);
                  }}
                  show={visible.current}
                  onToggle={() => toggle("current")}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  invalid={!!currentError}
                  autoFocus
                  onEnter={handleVerify}
                />
                {currentError ? (
                  <p className="mt-1 text-[11px] font-medium text-red-500">
                    {currentError}
                  </p>
                ) : null}
              </EntityFormField>
            </div>
          </div>
        ) : (
          /* ── Step 2: new password ── */
          <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-neutral-500">
                  Step 2 · New password
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-[#f0faf5] px-1.5 py-0.5 text-[10px] font-semibold text-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Check className="size-3" strokeWidth={3} />
                  Identity verified
                </span>
              </div>
              <div className="grid gap-3">
                <EntityFormField id="newPassword" label="New password">
                  <PasswordInput
                    id="newPassword"
                    value={next}
                    onChange={setNext}
                    show={visible.next}
                    onToggle={() => toggle("next")}
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                    invalid={sameAsCurrent}
                    autoFocus
                  />
                  {next ? (
                    <div className="mt-1.5">
                      <div className="flex gap-1">
                        {Array.from({ length: PASSWORD_RULES.length }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors",
                                i < metCount
                                  ? strength.bar
                                  : "bg-slate-200 dark:bg-neutral-700",
                              )}
                            />
                          ),
                        )}
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-[10px] font-semibold uppercase tracking-wider",
                          strength.text,
                        )}
                      >
                        {strength.label}
                      </p>
                    </div>
                  ) : null}
                  {sameAsCurrent ? (
                    <p className="mt-1 text-[11px] font-medium text-red-500">
                      New password must be different from the current one.
                    </p>
                  ) : null}
                </EntityFormField>

                <EntityFormField
                  id="confirmPassword"
                  label="Confirm new password"
                >
                  <PasswordInput
                    id="confirmPassword"
                    value={confirm}
                    onChange={setConfirm}
                    show={visible.confirm}
                    onToggle={() => toggle("confirm")}
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                    invalid={confirmMismatch}
                  />
                  {confirmMismatch ? (
                    <p className="mt-1 text-[11px] font-medium text-red-500">
                      Passwords do not match.
                    </p>
                  ) : null}
                </EntityFormField>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-neutral-500">
                Password requirements
              </p>
              <ul className="mt-2 space-y-1.5">
                {ruleResults.map((rule) => (
                  <li key={rule.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                        rule.ok
                          ? "border-[#008f68] bg-[#008f68] text-white"
                          : "border-slate-300 bg-white text-transparent dark:border-neutral-600 dark:bg-neutral-900",
                      )}
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        rule.ok
                          ? "text-slate-700 dark:text-neutral-200"
                          : "text-slate-400",
                      )}
                    >
                      {rule.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] leading-4 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                For your security, you'll stay signed in on this device, but any
                pending password-reset links will stop working.
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900/60">
          <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
            {step === 1
              ? "We'll verify your current password before continuing."
              : "Choose a strong password you don't use elsewhere."}
          </p>
          {step === 1 ? (
            <Button
              type="button"
              onClick={handleVerify}
              disabled={!current || verifying}
              className="h-9 rounded-lg bg-[#008f68] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60"
            >
              {verifying ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Lock className="mr-1.5 size-3.5" />
              )}
              {verifying ? "Verifying..." : "Continue"}
              {!verifying ? <ArrowRight className="ml-1.5 size-3.5" /> : null}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setNext("");
                  setConfirm("");
                }}
                disabled={saving}
                className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-9 rounded-lg bg-[#008f68] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-1.5 size-3.5" />
                )}
                {saving ? "Updating..." : "Update password"}
              </Button>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
