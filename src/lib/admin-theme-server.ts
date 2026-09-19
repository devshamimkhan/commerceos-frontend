import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_ADMIN_THEME, type AdminThemeSettings } from './admin-theme';

export async function getAdminThemeSettings(): Promise<AdminThemeSettings> {
  const cookie = (await cookies()).get('commerce.sid');
  if (!cookie) return DEFAULT_ADMIN_THEME;

  try {
    const base = (process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
    const response = await fetch(`${base}/auth/theme-settings`, {
      headers: { Cookie: `commerce.sid=${cookie.value}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return DEFAULT_ADMIN_THEME;
    const payload = await response.json() as { data?: AdminThemeSettings };
    return payload.data ?? DEFAULT_ADMIN_THEME;
  } catch {
    return DEFAULT_ADMIN_THEME;
  }
}
