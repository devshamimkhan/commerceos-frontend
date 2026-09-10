'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="auth-screen"><section className="auth-card service-error"><h1>Unable to load your workspace</h1><p>Please check your connection and try again.</p><button className="primary-action" onClick={reset}>Try again</button></section></main>;
}
