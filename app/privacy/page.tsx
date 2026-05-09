"use client"; // Required for useState

import React, { useState } from "react";
import { Lock, FileText } from "lucide-react";


function Section({ title, icon, children, open, onToggle }: any) {
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-4 text-left text-zinc-200 hover:text-white transition-colors"
      >
        {icon}
        <span className="font-medium">{title}</span>
      </button>
      {open && <div className="pb-6 animate-in fade-in slide-in-from-top-1">{children}</div>}
    </div>
  );
}

export default function LegalPage() {

  const [openSection, setOpenSection] = useState<string | null>("privacy");

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Legal & Privacy</h1>

         {/* ── Privacy Policy ── */}
         <Section title="Privacy Policy" icon={<Lock className="h-4 w-4" />} open={openSection === "privacy"} onToggle={() => toggle("privacy")}>
          <div className="prose prose-sm prose-invert max-w-none space-y-4 text-zinc-400 text-sm leading-relaxed">
            <p className="text-[10px] text-zinc-600">Last updated: May 2026</p>
            <h3 className="text-sm font-semibold text-zinc-300">1. Information We Collect</h3>
            <p>We collect information you provide directly: your email address, name, and social platform OAuth tokens when you connect accounts. We also collect usage data such as posts created, platforms connected, and scheduling activity.</p>
            <h3 className="text-sm font-semibold text-zinc-300">2. How We Use Your Information</h3>
            <p>Your information is used solely to operate Nect — authenticating your identity, publishing posts to your connected platforms, syncing schedules to your calendar, and improving the service. We do not sell your data to third parties.</p>
            <h3 className="text-sm font-semibold text-zinc-300">3. Social Platform Tokens</h3>
            <p>OAuth access tokens for LinkedIn and X are stored encrypted in our database. They are used exclusively to publish content on your behalf when you explicitly request it and approve it. You can revoke access at any time from each platform's security settings or by disconnecting within Nect.</p>
            <h3 className="text-sm font-semibold text-zinc-300">4. AI Generation</h3>
            <p>Post ideas you enter for AI generation are sent to Groq's and Gemini's API for processing. These requests are not stored by Nect after generation completes. Refer to Groq's privacy policy for their data handling practices.</p>
            <h3 className="text-sm font-semibold text-zinc-300">5. Data Retention</h3>
            <p>We retain your data as long as your account is active. Scheduled posts and publishing history are stored in our Supabase database. You may request full data deletion by deleting your account or contacting support.</p>
            <h3 className="text-sm font-semibold text-zinc-300">6. Security</h3>
            <p>We use industry-standard encryption for data in transit and at rest. OAuth tokens are encrypted before storage. We use Supabase's Row Level Security to ensure users can only access their own data.</p>
            <h3 className="text-sm font-semibold text-zinc-300">7. Contact</h3>
            <p>For privacy concerns, contact us at terms@nect.ai</p>
          </div>
        </Section>

        {/* ── Terms of Service ── */}
        <Section
          title="Terms of Service"
          icon={<FileText className="h-4 w-4 text-orange-500" />}
          open={openSection === "terms"}
          onToggle={() => toggle("terms")}
          ></Section>
            {/* ── Terms of Service ── */}
        <Section title="Terms of Service" icon={<FileText className="h-4 w-4" />} open={openSection === "terms"} onToggle={() => toggle("terms")}>
        <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
          <p className="text-[10px] text-zinc-600">Last updated: May 2026</p>
          <h3 className="text-sm font-semibold text-zinc-300">1. Acceptance of Terms</h3>
          <p>By using Nect, you agree to these terms. If you do not agree, do not use the service.</p>
          <h3 className="text-sm font-semibold text-zinc-300">2. Description of Service</h3>
          <p>Nect is a social media management tool that uses AI to generate, schedule, and publish content to connected platforms on your behalf upon approval. The service is provided "as is" during its beta period.</p>
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


      </div>
          
    </div>
  
  )
}
      