/* eslint-disable @next/next/no-img-element -- Settings previews use administrator-selected media URLs. */
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaImage, FaLink, FaPlus, FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import MediaPicker from '@/components/media/media-picker';

type LinkItem = { label: string; href: string };
type Settings = {
  brandName: string; brandAccent: string; logoUrl: string; footerLogoUrl: string; faviconUrl: string; promoEnabled: boolean;
  promoText: string; promoLink: LinkItem; phone: string; description: string;
  navigation: LinkItem[]; wholesaleLink: LinkItem; helpLinks: LinkItem[];
  aboutLinks: LinkItem[]; socialLinks: LinkItem[]; paymentMethods: string[]; copyright: string;
};
type LinksKey = 'navigation' | 'helpLinks' | 'aboutLinks' | 'socialLinks';
type Tab = 'branding' | 'header' | 'footer';
type ImageKey = 'logoUrl' | 'footerLogoUrl' | 'faviconUrl';
const endpoint = '/api/v1/auth/storefront-settings';

function LinkEditor({ title, description, items, limit, onChange }: { title: string; description: string; items: LinkItem[]; limit: number; onChange: (items: LinkItem[]) => void }) {
  return <section className="site-settings-card site-links-card"><header><div className="site-settings-icon"><FaLink /></div><div><h2>{title}</h2><p>{description}</p></div></header><div className="site-link-list">{items.map((link, index) => <div className="site-link-row" key={index}><span>{index + 1}</span><label>Label<input value={link.label} required maxLength={80} onChange={event => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /></label><label>Destination URL<input value={link.href} required maxLength={2000} placeholder="/products or https://example.com" onChange={event => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, href: event.target.value } : item))} /></label><button type="button" className="site-remove-link" aria-label={`Remove ${title} link ${index + 1}`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><FaTimes /></button></div>)}</div><button type="button" className="site-add-link" disabled={items.length >= limit} onClick={() => onChange([...items, { label: '', href: '' }])}><FaPlus /> Add link</button></section>;
}

export function LayoutEditor() {
  const [data, setData] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [picker, setPicker] = useState<ImageKey | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not load settings.');
      setData({ faviconUrl: '', footerLogoUrl: '', ...result.data }); setError('');
    }).catch(fetchError => { if (!controller.signal.aborted) setError(fetchError instanceof Error ? fetchError.message : 'Could not load settings.'); });
    return () => controller.abort();
  }, [reload]);

  if (!data) return <div className="site-settings-state" role="status"><strong>{error || 'Loading site settings...'}</strong>{error && <button type="button" onClick={() => setReload(value => value + 1)}>Retry</button>}</div>;

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setData(current => current ? { ...current, [key]: value } : current);
    setError('');
  }
  const updateLinks = (key: LinksKey, value: LinkItem[]) => update(key, value);
  const save = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...data, paymentMethods: data.paymentMethods.map(value => value.trim()).filter(Boolean) };
      const response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not save site settings.');
      setData(result.data); toast.success('Site settings saved.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Could not save site settings.';
      setError(message); toast.error(message);
    } finally { setSaving(false); }
  };

  const imageSetting = (key: ImageKey, title: string, help: string, square = false) => <div className="site-image-setting"><div className={square ? 'site-image-preview is-square' : 'site-image-preview'}>{data[key] ? <img src={data[key]} alt={`${title} preview`} /> : <FaImage />}</div><div><strong>{title}</strong><p>{help}</p><div className="site-image-actions"><button type="button" onClick={() => setPicker(key)}><FaUpload /> Choose / upload image</button>{data[key] && <button type="button" className="is-muted" onClick={() => update(key, '')}>Remove</button>}</div></div></div>;

  return <form className="site-settings-form" onSubmit={event => { event.preventDefault(); void save(); }}>
    <nav className="site-settings-tabs" aria-label="Site settings sections">{([['branding', 'Branding'], ['header', 'Header'], ['footer', 'Footer']] as [Tab, string][]).map(([tab, label]) => <button type="button" className={activeTab === tab ? 'active' : ''} aria-current={activeTab === tab ? 'page' : undefined} onClick={() => setActiveTab(tab)} key={tab}>{label}</button>)}</nav>

    <fieldset disabled={saving}>
      {activeTab === 'branding' && <div className="site-settings-stack"><section className="site-settings-card"><header><div className="site-settings-icon"><FaImage /></div><div><h2>Logo & favicon</h2><p>Select images from the shared Media Library.</p></div></header><div className="site-image-grid">{imageSetting('logoUrl', 'Header logo', 'Shown in the website header. A wide transparent image works best.')}{imageSetting('faviconUrl', 'Browser favicon', 'Shown in browser tabs and bookmarks. Use a square PNG or WebP image.', true)}</div></section><section className="site-settings-card"><header><div><h2>Brand information</h2><p>Used when an image logo is not selected and in website metadata.</p></div></header><div className="site-field-grid"><label>Brand name<input value={data.brandName} maxLength={60} required onChange={event => update('brandName', event.target.value)} /></label><label>Accent text<input value={data.brandAccent} maxLength={30} onChange={event => update('brandAccent', event.target.value)} /></label><label className="site-field-wide">Contact phone<input value={data.phone} maxLength={40} placeholder="01819601747" onChange={event => update('phone', event.target.value)} /></label></div></section></div>}

      {activeTab === 'header' && <div className="site-settings-stack"><section className="site-settings-card"><header><div><h2>Top announcement</h2><p>Manage the promotional bar displayed above the header.</p></div><label className="site-toggle"><input type="checkbox" checked={data.promoEnabled} onChange={event => update('promoEnabled', event.target.checked)} /><span aria-hidden="true" /></label></header><div className="site-field-grid"><label className="site-field-wide">Announcement text<input value={data.promoText} maxLength={200} onChange={event => update('promoText', event.target.value)} /></label><label>Link label<input value={data.promoLink.label} maxLength={80} required onChange={event => update('promoLink', { ...data.promoLink, label: event.target.value })} /></label><label>Link URL<input value={data.promoLink.href} maxLength={2000} required onChange={event => update('promoLink', { ...data.promoLink, href: event.target.value })} /></label></div></section><LinkEditor title="Header navigation" description="Add, edit or remove the links shown in the main website navigation." items={data.navigation} limit={12} onChange={value => updateLinks('navigation', value)} /><section className="site-settings-card"><header><div><h2>Wholesale link</h2><p>Controls the separate wholesale link in the navigation bar.</p></div></header><div className="site-field-grid"><label>Label<input value={data.wholesaleLink.label} maxLength={80} required onChange={event => update('wholesaleLink', { ...data.wholesaleLink, label: event.target.value })} /></label><label>Destination URL<input value={data.wholesaleLink.href} maxLength={2000} required onChange={event => update('wholesaleLink', { ...data.wholesaleLink, href: event.target.value })} /></label></div></section></div>}

      {activeTab === 'footer' && <div className="site-settings-stack"><section className="site-settings-card"><header><div className="site-settings-icon"><FaImage /></div><div><h2>Footer logo</h2><p>Choose or upload a separate logo for the dark website footer.</p></div></header>{imageSetting('footerLogoUrl', 'Footer logo', 'A light or high-contrast transparent logo works best. The header logo is used when this is empty.')}</section><section className="site-settings-card"><header><div><h2>Footer content</h2><p>Edit the store introduction, copyright and accepted payment names.</p></div></header><label>Store description<textarea value={data.description} maxLength={500} rows={4} onChange={event => update('description', event.target.value)} /></label><div className="site-field-grid"><label>Copyright text <small>The current year is added automatically.</small><input value={data.copyright} maxLength={150} onChange={event => update('copyright', event.target.value)} /></label><label>Accepted payments <small>Enter one payment method per line.</small><textarea rows={4} value={data.paymentMethods.join('\n')} onChange={event => update('paymentMethods', event.target.value.split('\n'))} /></label></div></section><LinkEditor title="Help links" description="Links shown in the footer Help column." items={data.helpLinks} limit={12} onChange={value => updateLinks('helpLinks', value)} /><LinkEditor title="About links" description="Links shown in the footer About column." items={data.aboutLinks} limit={12} onChange={value => updateLinks('aboutLinks', value)} /><LinkEditor title="Social links" description="Use labels such as Facebook, Instagram or YouTube to show their matching icons." items={data.socialLinks} limit={6} onChange={value => updateLinks('socialLinks', value)} /></div>}
    </fieldset>

    <div className="site-settings-savebar"><div>{error ? <p role="alert">{error}</p> : <span>Changes appear on the storefront after refresh.</span>}</div><button type="submit" disabled={saving}><FaSave /> {saving ? 'Saving...' : 'Save changes'}</button></div>
    <MediaPicker open={picker !== null} onClose={() => setPicker(null)} mediaType="image" currentUrl={picker ? data[picker] : ''} onSelect={(item: { url: string }) => { if (picker) update(picker, item.url); setPicker(null); }} />
  </form>;
}
