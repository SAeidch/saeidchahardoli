import "katex/dist/katex.min.css";
import Link from "next/link";
import Nav from "@/components/Nav";
import { profile } from "@/data/profile";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <footer className="border-t border-panel-fg/10 bg-panel px-6 py-8 text-panel-fg/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.15em] sm:flex-row">
          <span>
            {profile.mark} — © {profile.name}
          </span>
          <Link href="/" className="hover:text-panel-fg">
            ← Back to the main page
          </Link>
        </div>
      </footer>
    </>
  );
}
