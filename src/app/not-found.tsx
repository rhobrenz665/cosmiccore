import Link from "next/link";
export default function NotFound() { return <main className="not-found"><h1>Page not found</h1><p>That destination is unavailable.</p><Link className="primary-link" href="/dashboard">Go to dashboard</Link></main>; }
