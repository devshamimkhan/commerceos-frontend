import Link from 'next/link';
import Image from 'next/image';
import { LuShieldCheck as ShieldCheck } from 'react-icons/lu';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-top" aria-hidden="true" />
      <div className="auth-glow auth-glow-bottom" aria-hidden="true" />
      <div className="auth-container">
        <Link href="/login" className="auth-brand" aria-label="CommerceXLab sign in">
          <Image src="/branding/commercexlab-logo.png" alt="CommerceXLab" width={720} height={310} className="auth-brand-logo" priority />
          <span><strong>CommerceXLab</strong><small>Unified operations</small></span>
        </Link>
        <section className="auth-card" aria-label="Account access">{children}</section>
        <p className="auth-footer"><ShieldCheck size={16} aria-hidden="true" /> Secured by CommerceXLab identity protection</p>
      </div>
    </main>
  );
}
