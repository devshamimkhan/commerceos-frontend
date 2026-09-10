import 'server-only';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'member' | 'admin';
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookie = (await cookies()).get('commerce.sid');
  if (!cookie) return null;
  const response = await fetch(`${process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1'}/auth/me`, {
    headers: { Cookie: `commerce.sid=${cookie.value}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Authentication service is unavailable. Please try again.');
  const data: { user: AuthUser } = await response.json();
  return data.user;
}
