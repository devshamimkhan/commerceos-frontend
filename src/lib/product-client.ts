/* eslint-disable @typescript-eslint/no-explicit-any */
const base = '/api/v1/auth/products/items';
async function call(path = '', method = 'GET', body?: unknown) {
  try {
    const response = await fetch(base + path, { method, credentials: 'same-origin', cache: 'no-store', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    const data = await response.json();
    return response.ok ? data : { success: false, error: typeof data.error === 'string' ? data.error : data.error?.message || 'Request failed' };
  } catch { return { success: false, error: 'Could not reach the server.' }; }
}
export const getProducts = (query: Record<string, string | number> = {}) => call(`?${new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]))}`);
export const getProduct = (id: string) => call(`/${id}`);
export const createProduct = (body: any) => call('', 'POST', body);
export const duplicateProduct = (id: string) => call(`/${id}/duplicate`, 'POST', {});
export const updateProduct = (id: string, body: any) => call(`/${id}`, 'PUT', body);
export const updateProductStatus = (id: string, isActive: boolean) => call(`/${id}/status`, 'PATCH', { isActive });
export const deleteProduct = (id: string) => call(`/${id}`, 'DELETE', {});
