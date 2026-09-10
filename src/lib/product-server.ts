import 'server-only';
import { cookies } from 'next/headers';

const apiUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1';
async function request(path: string) {
  const session = (await cookies()).get('commerce.sid');
  if (!session) return { success: false, error: 'Authentication required' };
  try {
    const response = await fetch(`${apiUrl}/auth/products/items${path}`, { headers: { Cookie: `commerce.sid=${session.value}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    return response.ok ? data : { success: false, error: typeof data.error === 'string' ? data.error : data.error?.message || 'Request failed' };
  } catch { return { success: false, error: 'Could not load products.' }; }
}
export const getProductsServer = (limit = 10) => request(`?limit=${limit}`);
export const getProductSelectorServer = () => request('/selector');
export const getProductServer = (id: string) => /^[a-f\d]{24}$/i.test(id) ? request(`/${id}`) : Promise.resolve({ success: false, error: 'Invalid product ID' });
