"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Facebook, Instagram, Linkedin, MessageCircle, Radio } from "lucide-react";

import { completeOnboarding } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/platforms";

type Props = {
  initialFullName: string;
  initialPlatforms: string[];
};

const platformMeta: Record<
  PlatformKey,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  instagram: { label: "Instagram", icon: Instagram },
  x: { label: "X", icon: Radio },
  reddit: { label: "Reddit", icon: MessageCircle },
  facebook: { label: "Facebook", icon: Facebook },
  linkedin: { label: "LinkedIn", icon: Linkedin },
};

export function OnboardingGate({ initialFullName, initialPlatforms }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialFullName);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<PlatformKey[]>(
    PLATFORM_KEYS.filter((platform) => initialPlatforms.includes(platform))
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finalizeOnboarding() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await completeOnboarding(trimmed, selected);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  function togglePlatform(platform: PlatformKey) {
    setSelected((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(249,115,22,0.28),transparent_35%)]" />
      <Card className="relative w-full max-w-2xl border-zinc-800 bg-zinc-950/95">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Welcome to Nect</CardTitle>
          <CardDescription>Complete your command profile in 3 steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full ${
                  step >= n ? "bg-[#F97316]" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {step === 1 ? (
              <>
                <h3 className="text-xl font-semibold text-white">Who are you?</h3>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-zinc-200">
                    Full name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="border-zinc-700 bg-black text-white placeholder:text-zinc-500"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full bg-[#F97316] text-black hover:bg-[#ea580c]"
                  onClick={() => {
                    if (!name.trim()) {
                      setError("Please enter your name.");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                >
                  Continue
                </Button>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <h3 className="text-xl font-semibold text-white">Pick your Arsenal</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {PLATFORM_KEYS.map((platform) => {
                    const isSelected = selected.includes(platform);
                    const meta = platformMeta[platform];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-[#F97316] bg-[#F97316]/10 text-white"
                            : "border-zinc-800 bg-black text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {meta.label}
                        </span>
                        {isSelected ? <Check className="h-4 w-4 text-[#F97316]" /> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-1/2 text-zinc-200 hover:bg-zinc-900"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="w-1/2 bg-[#F97316] text-black hover:bg-[#ea580c]"
                    onClick={() => setStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : null}
            {step === 3 ? (
              <>
                <h3 className="text-xl font-semibold text-white">Finalize</h3>
                <p className="text-sm text-zinc-400">
                  Name: <span className="text-zinc-200">{name.trim()}</span>
                </p>
                <p className="text-sm text-zinc-400">
                  Platforms:{" "}
                  <span className="text-zinc-200">
                    {selected.length
                      ? selected.map((platform) => platformMeta[platform].label).join(", ")
                      : "None selected yet"}
                  </span>
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-1/2 text-zinc-200 hover:bg-zinc-900"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="w-1/2 bg-[#F97316] text-black hover:bg-[#ea580c]"
                    disabled={loading}
                    onClick={() => void finalizeOnboarding()}
                  >
                    {loading ? "Saving..." : "Launch Dashboard"}
                  </Button>
                </div>
              </>
            ) : null}
          </motion.div>
            {error ? (
              <p className="mt-4 text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
