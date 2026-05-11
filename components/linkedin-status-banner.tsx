"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function LinkedInStatusBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("linkedin");
    const connect = searchParams.get("connect");
    const message = searchParams.get("message");
    const xStatus = searchParams.get("x");
    const xReason = searchParams.get("x_reason");
    const xDetail = searchParams.get("x_detail");

    if (xStatus === "connected") {
      setVisible("X connected successfully.");
      return;
    }
    if (xStatus === "error") {
      let decodedDetail = "";
      if (xDetail) {
        try {
          decodedDetail = decodeURIComponent(xDetail);
        } catch {
          decodedDetail = xDetail;
        }
      }
      const parts = [
        "X connection failed.",
        xReason && `(${xReason})`,
        decodedDetail,
      ].filter(Boolean);
      setVisible(parts.join(" "));
      return;
    }

    if (status === "connected") {
      setVisible("LinkedIn connected successfully.");
    } else if (status === "error") {
      setVisible(message || "LinkedIn connection failed.");
    } else if (status === "session") {
      setVisible("Session expired. Sign in again, then connect LinkedIn.");
    } else if (connect && message) {
      setVisible(message);
    }
  }, [searchParams]);

  if (!visible) return null;

  const isError =
    searchParams.get("linkedin") === "error" ||
    searchParams.get("linkedin") === "session" ||
    searchParams.get("x") === "error";

  return (
    <div
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-red-900 bg-red-950/50 text-red-200"
          : "border-[#c2410c] bg-[#431407]/40 text-orange-100"
      }`}
      role="status"
    >
      {visible}
    </div>
  );
}
