"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRole } from "@/components/providers/role-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  appPanelClass,
  topbarAccentLineClass,
  topbarAccentBarClass,
} from "@/components/layout/sidebar-theme";
import {
  EntityFormField,
  entityFormInputClassName,
} from "@/components/forms/entity-form-layout";
import { settingsApi } from "@/lib/settings-api";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ChangePasswordCard } from "./ChangePasswordCard";

type ProfileState = {
  name: string;
  lastName: string;
  email: string;
  avatar: string;
};

const emptyProfile: ProfileState = {
  name: "",
  lastName: "",
  email: "",
  avatar: "",
};

function normalizeRoleLabel(role: string) {
  const normalized = role?.toString().trim().toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "agent") return "Agent";
  return role || "User";
}

function initialsFor(profile: ProfileState) {
  const initials = `${profile.name?.[0] || ""}${profile.lastName?.[0] || ""}`
    .trim()
    .toUpperCase();
  if (initials) return initials;
  return profile.email?.[0]?.toUpperCase() || "U";
}

export default function ProfilePage() {
  const { role } = useRole();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileState>(emptyProfile);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setInitialLoading(true);
      const profileData = await settingsApi.getProfile();
      const nextProfile = {
        name: profileData.name || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        avatar: profileData.avatar || "",
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  }

  const displayName =
    `${profile.name} ${profile.lastName}`.trim() ||
    profile.email ||
    "User profile";
  const roleLabel = normalizeRoleLabel(role);
  const initials = initialsFor(profile);
  const hasChanges = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(savedProfile),
    [profile, savedProfile],
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await settingsApi.updateProfile({
        name: profile.name.trim(),
        lastName: profile.lastName.trim(),
      });

      const nextProfile = {
        name: updated.name || profile.name.trim(),
        lastName: updated.lastName || profile.lastName.trim(),
        email: updated.email || profile.email,
        avatar: updated.avatar || profile.avatar.trim(),
      };

      setProfile(nextProfile);
      setSavedProfile(nextProfile);

      toast({
        title: "Saved",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(savedProfile);
  };

  if (initialLoading) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3">
          <Skeleton className="h-24 rounded-2xl bg-white dark:bg-slate-900" />
          <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Skeleton className="h-[360px] rounded-2xl bg-white dark:bg-slate-900" />
            <Skeleton className="h-[360px] rounded-2xl bg-white dark:bg-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2">
        <section className={cn(appPanelClass, "relative px-4 py-3 sm:px-5")}>
          <span className={topbarAccentLineClass} aria-hidden />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className={topbarAccentBarClass} aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Account settings
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                  Profile
                </h1>
                <p className="mt-0.5 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Keep your operator identity accurate across Center Quest.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-100 bg-[#f0faf5] px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                {roleLabel}
              </div>
              <div
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold uppercase tracking-wider",
                  hasChanges
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
                )}
              >
                <CheckCircle2 className="size-3.5" />
                {hasChanges ? "Unsaved changes" : "Up to date"}
              </div>
            </div>
          </div>
        </section>

        <div className="grid min-h-0 gap-2 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className={cn(appPanelClass, "relative p-3")}>
            <span className={topbarAccentLineClass} aria-hidden />
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="size-20 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <AvatarImage src={profile.avatar} alt={displayName} />
                    <AvatarFallback className="bg-[#f0faf5] text-xl font-bold text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="mt-2 max-w-full truncate text-[16px] font-bold leading-tight text-slate-950 dark:text-slate-50">
                  {displayName}
                </h2>
                <p className="mt-1 max-w-full truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="mt-2 grid gap-2">
              <ProfileFact
                icon={IdCard}
                label="Workspace role"
                value={`${roleLabel} account`}
              />
              <ProfileFact
                icon={Mail}
                label="Login email"
                value={profile.email || "No email"}
              />
              <ProfileFact
                icon={LockKeyhole}
                label="Editable fields"
                value="Name and password"
              />
            </div>
          </aside>

          <section className={cn(appPanelClass, "relative flex min-w-0 flex-col")}>
            <span className={topbarAccentLineClass} aria-hidden />
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <User className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Personal information
                  </p>
                  <h2 className="truncate text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-100">
                    Profile details
                  </h2>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-[#f4f5f7] p-2.5 dark:bg-slate-950">
              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Identity
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <EntityFormField id="name" label="First name">
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile((current) => ({
                            ...current,
                            name: e.target.value,
                          }))
                        }
                        placeholder="First name"
                        className={entityFormInputClassName}
                      />
                    </EntityFormField>

                    <EntityFormField id="lastName" label="Last name">
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile((current) => ({
                            ...current,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Last name"
                        className={entityFormInputClassName}
                      />
                    </EntityFormField>

                    <EntityFormField
                      id="email"
                      label="Email address"
                      hint="Email is managed by authentication and cannot be edited here."
                      className="md:col-span-2"
                    >
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          value={profile.email}
                          disabled
                          className={cn(entityFormInputClassName, "pl-8")}
                        />
                      </div>
                    </EntityFormField>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Access status
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <StatusRow label="Session" value="Active" />
                    <StatusRow label="Role" value={roleLabel} />
                  </div>
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-[#f0faf5] p-2.5 text-[11px] leading-4 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                    <div className="mb-1 flex items-center gap-1.5 font-semibold">
                      <BadgeCheck className="size-3.5 text-[#008f68] dark:text-emerald-400" />
                      Account note
                    </div>
                    Your display name appears in assignments, reports, and
                    timelines.
                  </div>
                </div>

              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {hasChanges
                  ? "Review your changes before saving."
                  : "No pending profile changes."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || saving}
                  className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="h-9 rounded-lg bg-[#008f68] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 size-3.5" />
                  )}
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </section>
        </div>

        <ChangePasswordCard />
      </div>
    </div>
  );
}

function ProfileFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IdCard;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-950">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/70">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
