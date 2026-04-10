"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const intent = searchParams.get("intent");

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        router.replace(next === "/dashboard" ? "/dashboard" : next);
        router.refresh();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        router.replace("/onboarding");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.3),transparent_40%)]" />
      <Card className="relative w-full max-w-md border-zinc-800/80 bg-zinc-950/90 shadow-[0_0_60px_rgba(249,115,22,0.08)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">
            Nect Command Access
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {mode === "login"
              ? "Sign in to your account"
              : "Create an account to get started"}
          </CardDescription>
          {intent === "publish" ? (
            <p className="text-sm text-zinc-300">
              Create an account to publish your content.
            </p>
          ) : null}
          {intent === "connect" ? (
            <p className="text-sm text-zinc-300">
              Create an account to connect LinkedIn and other apps.
            </p>
          ) : null}
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "bg-[#F97316] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-[#F97316] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-zinc-700 bg-black text-white placeholder:text-zinc-500"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-200">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-zinc-700 bg-black text-white placeholder:text-zinc-500"
                disabled={loading}
              />
            </div>
            {error ? (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <motion.div whileTap={{ scale: 0.98 }} className="w-full">
              <Button
                type="submit"
                className="w-full bg-[#F97316] text-black hover:bg-[#ea580c]"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </Button>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
