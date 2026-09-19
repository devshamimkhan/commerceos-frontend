/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy API client migration; remove after response contracts are consolidated.
// Shared upload transport for blog, product, document and future media consumers.
// Credentials stay in memory and expire after two minutes.
let credential;
let pendingCredential;
async function credentials() {
  if (credential && credential.expiresAt > Date.now() + 15000) return credential;
  if (!pendingCredential) pendingCredential = fetch('/api/v1/auth/media/token', {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000),
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Please sign in to access media.');
    credential = data; return data;
  }).finally(() => { pendingCredential = undefined; });
  return pendingCredential;
}
export async function uploaderFetch(path, options = {}) {
  if (!path.startsWith('/api/')) throw new Error('Invalid media API path');
  const auth = await credentials();
  const response = await fetch('/media-service' + path, {
    ...options, credentials: 'omit', cache: 'no-store',
    headers: { ...options.headers, Authorization: 'Bearer ' + auth.token },
    signal: options.signal || AbortSignal.timeout(120000),
  });
  if (response.status === 401) credential = undefined;
  return response;
}
async function mediaRequest(path, method, body) {
  const response = await uploaderFetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Media request failed');
  return { data };
}
export const mediaApi = {
  get: path => mediaRequest(path, 'GET'),
  put: (path, body) => mediaRequest(path, 'PUT', body),
  delete: path => mediaRequest(path, 'DELETE'),
};
export async function uploadFiles(files) {
  const uploaded = [];
  // Sequential single-file requests avoid buffering large batches in application servers.
  for (const file of files) {
    const form = new FormData(); form.append('file', file);
    const response = await uploaderFetch('/api/upload', { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed');
    uploaded.push(...result.files);
  }
  return uploaded;
}
