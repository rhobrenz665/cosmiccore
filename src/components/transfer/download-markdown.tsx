"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadMarkdown({ href, label }: { href: string; label: string }) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState("");

  async function download() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setSnapshot("");
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.message ?? "Download failed. Try again.");
        return;
      }
      const name = /^attachment; filename="([a-zA-Z0-9_.-]+)"$/.exec(response.headers.get("content-disposition") ?? "")?.[1];
      const length = response.headers.get("x-export-bytes");
      if (!name || length === null) throw new Error("Download headers unavailable.");
      const file = await response.blob();
      if (file.size !== Number(length)) throw new Error("Incomplete download.");
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      const asOf = response.headers.get("x-export-snapshot");
      if (asOf) setSnapshot(new Date(asOf).toLocaleString());
    } catch {
      setError("The download did not complete. Try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <div className="min-w-0">
    <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => void download()}>
      <Download aria-hidden="true" />{busy ? "Preparing download…" : label}
    </Button>
    {error && <p className="mt-1 text-sm" role="alert">{error}</p>}
    {snapshot && <p className="mt-1 text-sm text-muted-foreground" role="status">Export snapshot taken {snapshot}.</p>}
  </div>;
}
