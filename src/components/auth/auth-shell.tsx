import { LuShieldCheck as ShieldCheck } from 'react-icons/lu';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-top" aria-hidden="true" />
      <div className="auth-glow auth-glow-bottom" aria-hidden="true" />
      <div className="auth-container">
        <section className="auth-card" aria-label="Account access">{children}</section>
        <p className="auth-footer"><ShieldCheck size={16} aria-hidden="true" /> Secured by SportsShop identity protection</p>
      </div>
    </main>
  );
}
