import { uploadFiles } from '@/lib/media-client';

// Quill can embed pasted images as data URLs. Store uploaded URLs in the policy,
// rather than sending the image bytes through the content API.
export async function preparePolicyHtml(html: string): Promise<string> {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const uploaded = new Map<string, string>();
  for (const image of document.querySelectorAll('img')) {
    const source = image.getAttribute('src') || '';
    if (!source.startsWith('data:')) continue;
    if (!/^data:image\/(png|jpeg|gif|webp|avif);base64,/i.test(source)) {
      throw new Error('Use a PNG, JPEG, GIF, WebP or AVIF image.');
    }
    let url = uploaded.get(source);
    if (!url) {
      const blob = await (await fetch(source)).blob();
      const extension = blob.type.split('/')[1];
      const files = await uploadFiles([new File([blob], `delivery-policy.${extension}`, { type: blob.type })]);
      url = files[0]?.url;
      if (!url || !/^https?:\/\//i.test(url)) throw new Error('Image upload did not return a valid URL. Please try again.');
      uploaded.set(source, url);
    }
    image.setAttribute('src', url);
  }
  const result = document.body.innerHTML;
  if (result.length > 100000) throw new Error('Content is too long. Please shorten it to under 100,000 characters.');
  return result;
}
