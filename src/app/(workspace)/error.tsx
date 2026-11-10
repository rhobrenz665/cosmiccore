"use client";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <div className="page-wrap"><h1>Something went wrong</h1><p>This view could not load. Please try again.</p><Button onClick={reset}>Try again</Button></div>; }
