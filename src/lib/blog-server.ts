import 'server-only';
import { cookies } from 'next/headers';

const apiUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1';

export async function getBlogsServer() {
  const session = (await cookies()).get('commerce.sid');
  if (!session) return { success: false, error: 'Authentication required' };
  try {
    const query = new URLSearchParams({ page: '1', limit: '50' });
    const response = await fetch(`${apiUrl}/auth/blogs?${query}`, {
      headers: { Cookie: `commerce.sid=${session.value}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    return response.ok ? data : { success: false, error: typeof data.error === 'string' ? data.error : data.error?.message || 'Failed to load blogs' };
  } catch {
    return { success: false, error: 'Could not load blogs.' };
  }
}
