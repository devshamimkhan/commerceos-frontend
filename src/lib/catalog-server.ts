import 'server-only';
import { cookies } from 'next/headers';

const apiUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1';
const catalogKinds = new Set(['categories', 'tags', 'brands', 'attributes']);

async function requestCatalog(path: string) {
  const session = (await cookies()).get('commerce.sid');
  if (!session) return { success: false, error: 'Authentication required' };

  try {
    const response = await fetch(`${apiUrl}/auth/products${path}`, {
      headers: { Cookie: `commerce.sid=${session.value}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (response.ok) return data;
    return {
      success: false,
      error: typeof data.error === 'string'
        ? data.error
        : data.error?.message || 'Request failed',
    };
  } catch {
    return { success: false, error: 'Could not load catalog data.' };
  }
}

export async function getCatalogServer(kind: string) {
  if (!catalogKinds.has(kind)) return { success: false, error: 'Unknown catalog module' };
  return requestCatalog(`/${kind}`);
}

export async function getCatalogItemServer(kind: string, id: string) {
  if (!catalogKinds.has(kind)) return { success: false, error: 'Unknown catalog module' };
  if (!/^[a-f\d]{24}$/i.test(id)) return { success: false, error: 'Invalid ID' };
  return requestCatalog(`/${kind}/${id}`);
}
