'use client';

import { useRef, useState, type FormEvent } from 'react';
import { LuArrowRight as ArrowRight, LuEye as Eye, LuEyeOff as EyeOff, LuLoaderCircle as LoaderCircle, LuLockKeyhole as LockKeyhole, LuUserRound as UserRound, LuCircleAlert as AlertCircle } from 'react-icons/lu';

type FieldErrors = Record<string, string[] | undefined>;

export function AuthForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [visible, setVisible] = useState(false);
  const busy = useRef(false);
  const messageRef = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setErrors({});
    setMessage('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = {
      identity: data.get('identity'), password: data.get('password'), remember: data.get('remember') === 'on',
    };

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const fields: FieldErrors = result?.error?.fields ?? {};
        setErrors(fields);
        setMessage(result?.error?.message ?? 'Unable to connect. Please try again.');
        requestAnimationFrame(() => {
          const input = form.elements.namedItem(Object.keys(fields)[0] ?? '');
          if (input instanceof HTMLInputElement) input.focus();
          else messageRef.current?.focus();
        });
        return;
      }
      // A fresh navigation ensures protected server content uses the newly issued cookie.
      window.location.replace('/dashboard');
    } catch {
      setMessage('Unable to connect. Please check your connection and try again.');
      requestAnimationFrame(() => messageRef.current?.focus());
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function errorFor(name: string) {
    return errors[name]?.length ? <p id={`${name}-error`} className="field-error">{errors[name]?.[0]}</p> : null;
  }
  function validationProps(name: string) {
    return { 'aria-invalid': !!errors[name]?.length, 'aria-describedby': errors[name]?.length ? `${name}-error` : undefined };
  }

  return (
    <>
      <header className="auth-header">
        <p className="auth-eyebrow">Workspace access</p>
        <h1>Welcome back</h1>
        <p>Sign in to your SportsShop workspace.</p>
      </header>

      <form onSubmit={submit} className="auth-form" aria-busy={pending}>
        {message && <div className="auth-error" role="alert" tabIndex={-1} ref={messageRef}><AlertCircle size={17} aria-hidden="true" /><span>{message}</span></div>}
        <fieldset disabled={pending}>
          <div className="auth-field">
            <label htmlFor="identity">Username or email</label>
            <div className="field-shell"><UserRound size={17} aria-hidden="true" /><input id="identity" name="identity" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Enter username or email" required maxLength={254} {...validationProps('identity')} /></div>
            {errorFor('identity')}
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="field-shell"><LockKeyhole size={17} aria-hidden="true" />
              <input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required minLength={1} maxLength={128} {...validationProps('password')} />
              <button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}<span>{visible ? 'Hide' : 'Show'}</span></button>
            </div>
            {errorFor('password')}
          </div>
          <label className="remember-me"><input name="remember" type="checkbox" />Keep me signed in for 7 days</label>
          <button className="primary-action" type="submit" disabled={pending}>
            {pending ? <><LoaderCircle size={17} className="spinner" aria-hidden="true" />Signing in…</> : <>Sign in securely<ArrowRight size={17} aria-hidden="true" /></>}
          </button>
        </fieldset>
      </form>
    </>
  );
}
