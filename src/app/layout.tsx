import type { Metadata } from "next";
import "./globals.css";
import { AppearanceProvider } from "@/components/appearance/provider";

export const metadata: Metadata = {
  title: "CosmicCore",
  description: "Your private knowledge workspace",
};

const appearanceScript = `var a,c;try{a=localStorage.getItem('cosmiccore-appearance');c=localStorage.getItem('cosmiccore-color')}catch{}var r=document.documentElement;r.dataset.appearance=a==='minimal'?'minimal':'cosmic';r.dataset.color=c==='light'||c==='dark'?c:'system';r.classList.toggle('dark',r.dataset.appearance==='cosmic'||r.dataset.color==='dark'||(r.dataset.color==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceScript }} /></head>
      <body><AppearanceProvider>{children}</AppearanceProvider></body>
    </html>
  );
}
