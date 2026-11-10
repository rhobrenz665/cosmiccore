import type { Metadata } from "next";
import "./globals.css";
import { AppearanceProvider } from "@/components/appearance/provider";

export const metadata: Metadata = {
  title: "CosmicCore",
  description: "Your private knowledge workspace",
};

const appearanceScript = `try{var a=localStorage.getItem('cosmiccore-appearance');var c=localStorage.getItem('cosmiccore-color');var r=document.documentElement;r.dataset.appearance=a==='minimal'?'minimal':'cosmic';r.dataset.color=c==='light'||c==='dark'?c:'system';r.classList.toggle('dark',r.dataset.color==='dark'||(r.dataset.color==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceScript }} /></head>
      <body><AppearanceProvider>{children}</AppearanceProvider></body>
    </html>
  );
}
