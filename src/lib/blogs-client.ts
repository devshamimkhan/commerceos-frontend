/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy API client migration; remove after response contracts are consolidated.
const base = '/api/v1/auth/blogs';
async function call(path = '', method = 'GET', body) {
  try {
    const response = await fetch(base + path, {
      method, credentials: 'same-origin', cache: 'no-store',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) return { success: false, error: typeof result.error === 'string' ? result.error : result.error?.message || 'Request failed. Please try again.', fieldErrors: result.fieldErrors };
    return result;
  } catch { return { success: false, error: 'Could not reach the server. Please try again.' }; }
}
export const getBlogs = (query = {}) => call('?' + new URLSearchParams(query));
export const getBlogFormMeta = (query = {}) => call('/meta?' + new URLSearchParams(query));
export const createBlog = input => call('', 'POST', input);
export const updateBlog = (id, input) => call('/' + id, 'PUT', input);
export const deleteBlog = id => call('/' + id, 'DELETE', {});
export const createBlogCategory = input => call('/categories', 'POST', input);
export const updateBlogCategory = (id, input) => call('/categories/' + id, 'PUT', input);
export const deleteBlogCategory = id => call('/categories/' + id, 'DELETE', {});
export const createBlogTag = input => call('/tags', 'POST', input);
export const updateBlogTag = (id, input) => call('/tags/' + id, 'PUT', input);
export const deleteBlogTag = id => call('/tags/' + id, 'DELETE', {});
