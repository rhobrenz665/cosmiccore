import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return <main className="landing">
    <div className="landing-inner">
      <span className="eyebrow"><Sparkles size={16} /> CosmicCore 2.0</span>
      <h1>A quieter place for your ideas.</h1>
      <p>Capture Markdown notes, keep useful references, and find your way back to what matters. The workspace foundation is ready to explore locally.</p>
      <Link className="primary-link" href="/dashboard">Explore the workspace <ArrowRight size={18}/></Link>
      <p className="fine-print">Local interface preview. Sign-in and private storage arrive in the next build milestones.</p>
    </div>
  </main>;
}
