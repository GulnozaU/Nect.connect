// FILE PATH: app/auth/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicSiteOrigin } from "@/lib/public-site-origin";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Mail, Lock, User, ArrowRight,
  Eye, EyeOff, CheckCircle2,
} from "lucide-react";

function NectLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8 2 4 5 4 9c0 2 1 3.5 2.5 4.5" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 22c4 0 8-3 8-7 0-2-1-3.5-2.5-4.5" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12c0-2.5 2-4.5 4-5.5S13 5.5 15 7s2.5 3.5 2 5.5-2.5 4-5 4.5"
        stroke="#F97316" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.5 2" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill="#F97316" />
      <circle cx="6.5" cy="13.5" r="1.2" fill="#F97316" opacity="0.6" />
      <circle cx="17.5" cy="10.5" r="1.2" fill="#F97316" opacity="0.6" />
    </svg>
  );
}

function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode]                 = useState<Mode>("signin");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [fullName, setFullName]         = useState("");
  const [agreed, setAgreed]             = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [emailSent, setEmailSent]       = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") !== "auth_callback_failed") return;
    setError(
      "Google sign-in did not complete. In Supabase: Authentication → URL Configuration — set Site URL to your live domain, and add `https://<your-domain>/api/auth/callback` under Redirect URLs (if the redirect URL is not allowlisted, Supabase sends users to Site URL, which may be an old domain). In Google Cloud Console → OAuth client, Authorized redirect URIs must include `https://<project-ref>.supabase.co/auth/v1/callback`. Optional: set NEXT_PUBLIC_SITE_URL to your canonical origin so OAuth always matches the allowlist."
    );
    const clean = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", clean);
  }, []);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    // Always send the OAuth round-trip back to the same host the user is on.
    // If `redirectTo` is not in Supabase "Redirect URLs", Supabase falls back to Site URL
    // with `?code=` on `/` — often an old domain — which breaks session exchange.
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : getPublicSiteOrigin();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  // ── Email sign in ─────────────────────────────────────────────────────────
  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = "/dashboard";
  }

  // ── Email sign up ─────────────────────────────────────────────────────────
  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the Terms of Service and Privacy Policy."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError(null);
    const origin = getPublicSiteOrigin();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setEmailSent(true);
    setLoading(false);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setEmailSent(false);
    setEmail("");
    setPassword("");
    setFullName("");
    setAgreed(false);
  }

  // ── Email sent screen ─────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-black px-5 py-12">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#F97316]/10 blur-[130px]" />
        </div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-3 text-sm text-zinc-400">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-white">{email}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Click the link to activate your account and get started.
          </p>
          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-left space-y-2">
            <p className="text-xs font-semibold text-zinc-400">Didn't receive it?</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-zinc-600">
              <li>Check your spam or junk folder</li>
              <li>It can take up to 2 minutes</li>
              <li>Make sure you entered the right email</li>
            </ul>
            <button
              onClick={async () => {
                await supabase.auth.resend({
                  type: "signup",
                  email,
                  options: { emailRedirectTo: `${getPublicSiteOrigin()}/api/auth/callback` },
                });
              }}
              className="mt-2 text-xs text-[#F97316] hover:text-[#fb923c] transition-colors"
            >
              Resend confirmation email →
            </button>
          </div>
          <button
            onClick={() => switchMode("signin")}
            className="mt-6 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </main>
    );
  }

  // ── Main auth form ────────────────────────────────────────────────────────
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black px-5 py-12">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#F97316]/10 blur-[130px]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-[#F97316]/5 blur-[110px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold text-white">
            <NectLogo className="h-8 w-8" />
            <span className="text-xl tracking-tight">Nect</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {mode === "signin"
              ? "Sign in to your Nect account"
              : "Start publishing platform-perfect content"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">

          {/* Error banner */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading
              ? <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              : <GoogleLogo className="h-5 w-5" />}
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs font-medium text-zinc-600">or continue with email</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Email form */}
          <form
            onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
            className="space-y-4"
          >
            {/* Full name — signup only */}
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-white/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-white/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-11 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-white/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox — signup only */}
            {mode === "signup" && (
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreed}
                  required
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-[#F97316]"
                />
                <label htmlFor="terms" className="text-xs text-zinc-500 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/privacy" className="text-zinc-300 underline hover:text-white transition-colors">
                    Terms of Service and Privacy Policy
                  </Link>{" "}
                  .
                </label>
              </div>
            )}

            {/* Forgot password — signin only */}
            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) { setError("Enter your email first."); return; }
                    setLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${getPublicSiteOrigin()}/api/auth/callback?type=recovery`,
                    });
                    setLoading(false);
                    if (error) setError(error.message);
                    else setEmailSent(true);
                  }}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading || (mode === "signup" && !agreed)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] py-3 text-sm font-bold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="mt-5 text-center text-sm text-zinc-600">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-[#F97316] hover:text-[#fb923c] transition-colors"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="font-semibold text-[#F97316] hover:text-[#fb923c] transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-700">
          <Link href="/" className="hover:text-zinc-500 transition-colors">
            ← Back to Nect
          </Link>
        </p>
      </div>
    </main>
  );
}