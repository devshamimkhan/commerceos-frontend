import Link from 'next/link';
import { LuShieldCheck as ShieldCheck } from 'react-icons/lu';

export function AuthShell({ logoUrl, children }: { logoUrl: string; children: React.ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-top" aria-hidden="true" />
      <div className="auth-glow auth-glow-bottom" aria-hidden="true" />
      <div className="auth-container">
        <Link href="/login" className="auth-brand" aria-label="CommerceXLab sign in">
          {/* The admin-managed logo may be served by the shared media service. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="CommerceXLab" className="auth-brand-logo" />
        </Link>
        <section className="auth-card" aria-label="Account access">{children}</section>
        <p className="auth-footer"><ShieldCheck size={16} aria-hidden="true" /> Secured by CommerceXLab identity protection</p>
      </div>
    </main>
  );
}
