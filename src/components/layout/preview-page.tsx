import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function PreviewPage({ title, description, next, href }: { title: string; description: string; next?: string; href?: string }) {
  return <div className="page-wrap"><div className="page-heading"><span className="eyebrow"><Sparkles size={15}/> WORKSPACE PREVIEW</span><h1>{title}</h1><p>{description}</p></div><section className="preview-card"><div className="preview-symbol"><Sparkles size={25}/></div><h2>{title} is taking shape</h2><p>This route is ready for local interface review. Your content and account controls will appear when their services are connected.</p>{next && href && <Link className="text-link" href={href}>{next}<ArrowRight size={17}/></Link>}</section></div>;
}
