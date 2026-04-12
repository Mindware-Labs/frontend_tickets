"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

import { auth } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setTimeout(() => setRateLimitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call real backend API
      await auth.login(formData.email, formData.password);

      // Get redirect URL from query params if exists, or determine based on role
      const redirectParam = searchParams.get("redirect");
      let redirectTo = redirectParam || "/dashboard";

      // If no redirect param, redirect based on role
      if (!redirectParam) {
        redirectTo = "/dashboard";
      }

      // Redirect to dashboard or original destination
      router.push(redirectTo);
    } catch (err: any) {
      let errorMessage =
        err.message || "Login failed. Please check your credentials.";

      if (
        errorMessage.toLowerCase().includes("too many requests") ||
        errorMessage.toLowerCase().includes("throttler")
      ) {
        setRateLimitCountdown(60);
        setError("too_many_requests");
      } else if (errorMessage.includes("Cannot connect to the server")) {
        setError(
          "Unable to connect to the server. Please ensure the backend is running and try again.",
        );
      } else if (errorMessage.includes("fetch")) {
        setError(
          "Network error. Please check your connection and ensure the backend server is running.",
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Card header */}
      <div className="text-center border-b border-slate-800/50 bg-slate-900/50">
        {/* --- CHANGE: Replaced the icon div with the logo --- */}
        <div className="mx-auto w-50 h-26 relative ">
          <Image
            src="/images/LOGO CQ-13.png"
            alt="cq Logo"
            fill
            sizes="200px"
            className="object-contain" // Esto evita que el logo se estire o deforme
            priority
          />
        </div>
        {/* --------------------------------------------------------- */}

        <h1 className="text-2xl font-bold text-white tracking-tight "></h1>
      </div>

      {/* Card body */}
      <div className="p-8 pt-6">
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {/* Email Field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-slate-300 text-xs font-semibold uppercase tracking-wider"
            >
              Work Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="pl-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all h-11"
                required
                autoComplete="off"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="password"
                className="text-slate-300 text-xs font-semibold uppercase tracking-wider"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-500 hover:text-blue-400 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all h-11"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`p-3 rounded-lg border ${error === "too_many_requests" ? "bg-orange-500/10 border-orange-500/30" : "bg-red-500/10 border-red-500/20"}`}
            >
              {error === "too_many_requests" ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm text-orange-400 text-center font-medium">
                    Too many failed attempts. Please wait before trying again.
                  </p>
                  {rateLimitCountdown > 0 && (
                    <p className="text-xs text-orange-300/70 text-center">
                      You can try again in{" "}
                      <span className="font-bold text-orange-300">
                        {rateLimitCountdown}s
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all duration-200"
            disabled={isLoading || rateLimitCountdown > 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-600 bg-slate-950/50 text-center">
        <p className="text-xs text-slate-400">
          System used by CCQUEST and RIG HUT personnel. Access is restricted to
          authorized users only. <br />
          <span className="text-slate-600">Powered by Mindware Labs.</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
