
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Linkedin, Facebook, Radio, Calendar,
  CheckCircle2, Trash2, Loader2, ChevronDown, ChevronUp,
  Shield, FileText, Lock, AlertTriangle,
} from "lucide-react";

interface Props {
  user: { id: string; email: string; name: string };
  connected: { linkedin: boolean; facebook: boolean; x: boolean; googleCalendar: boolean };
}

const PLATFORMS = [
  { key: "linkedin",  label: "LinkedIn",  icon: Linkedin,  color: "#0A66C2", connectHref: "/api/auth/linkedin",  available: true },
  { key: "facebook",  label: "Facebook",  icon: Facebook,  color: "#1877F2", connectHref: "/api/auth/facebook",  available: true },
  { key: "x",         label: "X",         icon: Radio,     color: "#e4e4e7", connectHref: "/api/auth/twitter",   available: true },
];

type Section = "account" | "platforms" | "billing" | "privacy" | "terms" | "delete" | null;

export default function SettingsClient({ user, connected }: Props) {
  const [openSection, setOpenSection] = useState<Section>("account");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting]           = useState(false);
  const [toast, setToast]                 = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      showToast("error", "Failed to delete account. Contact support.");
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function toggle(s: Section) {
    setOpenSection((prev) => prev === s ? null : s);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-sm shadow-xl ${
          toast.type === "success" ? "border-green-800 bg-green-950 text-green-300" : "border-red-800 bg-red-950 text-red-300"
        }`}>{toast.msg}</div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your account, connections, and preferences.</p>
      </div>

      <div className="space-y-3">

        {/* ── Account ── */}
        <Section title="Account" icon={<Shield className="h-4 w-4" />} open={openSection === "account"} onToggle={() => toggle("account")}>
          <div className="space-y-4">
            <Row label="Email" value={user.email} />
            <Row label="Name"  value={user.name || "Not set"} />
            <Row label="User ID" value={user.id} mono />
            <button onClick={handleSignOut}
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              Sign out
            </button>
          </div>
        </Section>

        {/* ── Connected platforms ── */}
        <Section title="Connected Platforms" icon={<Linkedin className="h-4 w-4" />} open={openSection === "platforms"} onToggle={() => toggle("platforms")}>
          <div className="space-y-2">
            {PLATFORMS.map(({ key, label, icon: Icon, color, connectHref }) => {
              const isConnected = connected[key as keyof typeof connected];
              return (
                <div key={key} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className={`text-sm ${isConnected ? "text-zinc-200" : "text-zinc-500"}`}>{label}</span>
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : (
                    <a href={connectHref}
                      className="rounded-lg bg-[#F97316]/10 px-3 py-1.5 text-xs font-semibold text-[#F97316] transition-colors hover:bg-[#F97316]/20">
                      Connect
                    </a>
                  )}
                </div>
              );
            })}

            {/* Google Calendar */}
            <div className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[#4285F4]" />
                <div>
                  <p className={`text-sm ${connected.googleCalendar ? "text-zinc-200" : "text-zinc-500"}`}>Google Calendar</p>
                  <p className="text-[10px] text-zinc-700">Scheduled posts appear as calendar events</p>
                </div>
              </div>
              {connected.googleCalendar ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>
              ) : (
                <a href="/api/auth/google-calendar"
                  className="rounded-lg bg-[#4285F4]/10 px-3 py-1.5 text-xs font-semibold text-[#4285F4] hover:bg-[#4285F4]/20 transition-colors">
                  Connect
                </a>
              )}
            </div>

            {/* Coming soon */}
            {[{ label: "Instagram", color: "#E1306C" }, { label: "Reddit", color: "#FF4500" }].map(({ label, color }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 px-4 py-3 opacity-50">
                <span className="text-sm text-zinc-600">{label}</span>
                <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] text-zinc-700">Coming soon</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Privacy Policy ── */}
        <Section title="Privacy Policy" icon={<Lock className="h-4 w-4" />} open={openSection === "privacy"} onToggle={() => toggle("privacy")}>
          <div className="prose prose-sm prose-invert max-w-none space-y-4 text-zinc-400 text-sm leading-relaxed">
            <p className="text-[10px] text-zinc-600">Last updated: May 2026</p>
            <h3 className="text-sm font-semibold text-zinc-300">1. Information We Collect</h3>
            <p>We collect information you provide directly: your email address, name, and social platform OAuth tokens when you connect accounts. We also collect usage data such as posts created, platforms connected, and scheduling activity.</p>
            <h3 className="text-sm font-semibold text-zinc-300">2. How We Use Your Information</h3>
            <p>Your information is used solely to operate Nect — authenticating your identity, publishing posts to your connected platforms, syncing schedules to your calendar, and improving the service. We do not sell your data to third parties.</p>
            <h3 className="text-sm font-semibold text-zinc-300">3. Social Platform Tokens</h3>
            <p>OAuth access tokens for LinkedIn, Facebook, and X are stored encrypted in our database. They are used exclusively to publish content on your behalf when you explicitly request it. You can revoke access at any time from each platform's security settings or by disconnecting within Nect.</p>
            <h3 className="text-sm font-semibold text-zinc-300">4. AI Generation</h3>
            <p>Post ideas you enter for AI generation are sent to Groq's API for processing. These requests are not stored by Nect after generation completes. Refer to Groq's privacy policy for their data handling practices.</p>
            <h3 className="text-sm font-semibold text-zinc-300">5. Data Retention</h3>
            <p>We retain your data as long as your account is active. Scheduled posts and publishing history are stored in our Supabase database. You may request full data deletion by deleting your account or contacting support.</p>
            <h3 className="text-sm font-semibold text-zinc-300">6. Security</h3>
            <p>We use industry-standard encryption for data in transit and at rest. OAuth tokens are encrypted before storage. We use Supabase's Row Level Security to ensure users can only access their own data.</p>
            <h3 className="text-sm font-semibold text-zinc-300">7. Contact</h3>
            <p>For privacy concerns, contact us at privacy@nect.ai</p>
          </div>
        </Section>

        {/* ── Terms of Service ── */}
        <Section title="Terms of Service" icon={<FileText className="h-4 w-4" />} open={openSection === "terms"} onToggle={() => toggle("terms")}>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <p className="text-[10px] text-zinc-600">Last updated: May 2026</p>
            <h3 className="text-sm font-semibold text-zinc-300">1. Acceptance of Terms</h3>
            <p>By using Nect, you agree to these terms. If you do not agree, do not use the service.</p>
            <h3 className="text-sm font-semibold text-zinc-300">2. Description of Service</h3>
            <p>Nect is a social media management tool that uses AI to generate, schedule, and publish content to connected platforms on your behalf. The service is provided "as is" during its beta period.</p>
            <h3 className="text-sm font-semibold text-zinc-300">3. Your Responsibilities</h3>
            <p>You are responsible for all content published through your account. You must comply with the terms of service of each connected platform (LinkedIn, Facebook, X). You may not use Nect to publish spam, misinformation, illegal content, or content that violates platform policies.</p>
            <h3 className="text-sm font-semibold text-zinc-300">4. Account</h3>
            <p>You are responsible for maintaining the security of your account credentials. Notify us immediately of any unauthorized access. We reserve the right to suspend accounts that violate these terms.</p>
            <h3 className="text-sm font-semibold text-zinc-300">5. AI-Generated Content</h3>
            <p>AI-generated posts are suggestions. You are responsible for reviewing and approving all content before publishing. Nect is not liable for the accuracy, tone, or appropriateness of AI-generated content.</p>
            <h3 className="text-sm font-semibold text-zinc-300">6. Service Availability</h3>
            <p>We aim for high availability but do not guarantee uninterrupted service. Scheduled posts may fail if your connected platform tokens expire or if platform APIs are unavailable. We are not liable for missed posts due to service interruptions.</p>
            <h3 className="text-sm font-semibold text-zinc-300">7. Limitation of Liability</h3>
            <p>Nect is not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to amounts paid by you in the past 12 months.</p>
            <h3 className="text-sm font-semibold text-zinc-300">8. Changes</h3>
            <p>We may update these terms. Continued use after changes constitutes acceptance. Contact: terms@nect.ai</p>
          </div>
        </Section>

        {/* ── Delete Account ── */}
        <Section title="Delete Account" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} open={openSection === "delete"} onToggle={() => toggle("delete")} danger>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Deleting your account will permanently remove all your data — posts, connections, scheduled content, and account information. <strong className="text-red-400">This cannot be undone.</strong>
            </p>
            <ul className="space-y-1 text-xs text-zinc-600 list-disc list-inside">
              <li>All scheduled posts will be cancelled</li>
              <li>All platform connections will be revoked</li>
              <li>Your publishing history will be deleted</li>
              <li>Your account cannot be recovered</li>
            </ul>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Type <span className="font-bold text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-red-700/60 focus:outline-none"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Permanently delete my account
            </button>
          </div>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, icon, open, onToggle, children, danger = false }: {
  title: string; icon: React.ReactNode; open: boolean;
  onToggle: () => void; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${danger ? "border-red-900/30 bg-red-950/5" : "border-white/8 bg-white/[0.02]"}`}>
      <button onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2.5">
          <span className={danger ? "text-red-500" : "text-zinc-500"}>{icon}</span>
          <span className={`text-sm font-semibold ${danger ? "text-red-400" : "text-zinc-200"}`}>{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
      </button>
      {open && <div className="border-t border-white/5 px-5 py-4">{children}</div>}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-600">{label}</span>
      <span className={`text-xs text-zinc-300 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}