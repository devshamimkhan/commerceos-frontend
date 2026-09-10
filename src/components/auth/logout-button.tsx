'use client';

import { useRef, useState } from 'react';
import { LuLogOut as LogOut, LuLoaderCircle as LoaderCircle } from 'react-icons/lu';

export function LogoutButton({ className = 'secondary-action' }: { className?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  async function logout() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        credentials: 'same-origin', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Logout failed');
      window.location.replace('/login');
    } catch {
      setError('Could not sign out. Please try again.');
      busy.current = false;
      setPending(false);
    }
  }
  return <div><button className={className} onClick={logout} disabled={pending}>{pending ? <LoaderCircle size={16} className="spinner" /> : <LogOut size={16} />}<span>{pending ? 'Signing out…' : 'Logout'}</span></button>{error && <p className="field-error" role="alert">{error}</p>}</div>;
}
