/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy API client migration; remove after response contracts are consolidated.
const base = '/api/v1/auth/products';
async function call(path, method = 'GET', body) {
  try {
    const response = await fetch(base + path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    });
    const data = await response.json();
    if (response.ok) return data;
    const error = typeof data.error === 'string'
      ? data.error
      : data.error?.message || 'Request failed';
    return { success: false, error };
  } catch {
    return { success: false, error: 'Could not reach the server.' };
  }
}
export const getCatalog = (kind, search = '') => call(`/${kind}?${new URLSearchParams({ search })}`);
export const getCatalogItem = (kind, id) => call(`/${kind}/${id}`);
export const createCatalogItem = (kind, body) => call(`/${kind}`, 'POST', body);
export const updateCatalogItem = (kind, id, body) => call(`/${kind}/${id}`, 'PUT', body);
export const deleteCatalogItem = (kind, id) => call(`/${kind}/${id}`, 'DELETE', {});
