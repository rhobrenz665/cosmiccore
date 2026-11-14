import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return <main className="landing">
    <div className="landing-inner">
      <span className="eyebrow"><Sparkles size={16} /> CosmicCore 2.0</span>
      <h1>A quieter place for your ideas.</h1>
      <p>Capture Markdown notes, keep useful references, and find your way back to what matters in a private workspace.</p>
      <Link className="primary-link" href="/auth/sign-in">Sign in with Google <ArrowRight size={18}/></Link>
      <p className="fine-print">Each account has its own private CosmicCore workspace.</p>
    </div>
  </main>;
}
