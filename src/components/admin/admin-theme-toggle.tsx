'use client';

import { useEffect, useState } from 'react';
import { LuMoon as Moon, LuSun as Sun } from 'react-icons/lu';

const STORAGE_KEY = 'commerce-admin-theme';

export function AdminThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setDark(localStorage.getItem(STORAGE_KEY) === 'dark'); } catch { /* Default to light. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const container = document.querySelector('.admin-container');
    container?.classList.toggle('is-dark', dark);
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch { /* Storage is optional. */ }
    return () => { container?.classList.remove('is-dark'); };
  }, [dark, ready]);
  return <button type="button" onClick={() => setDark(!dark)}
    className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''} theme-toggle-${dark ? 'dark' : 'light'}`}
    aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
    <span className="theme-toggle-pill" aria-hidden="true"><span className={`theme-toggle-icon is-${dark ? 'dark' : 'light'}`}>
      {dark ? <Moon size={16} /> : <Sun size={16} />}
    </span></span>
  </button>;
}
