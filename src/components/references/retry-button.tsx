"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ReferenceRetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button variant="outline" size="lg" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    {pending ? "Retrying…" : "Retry"}
  </Button>;
}
