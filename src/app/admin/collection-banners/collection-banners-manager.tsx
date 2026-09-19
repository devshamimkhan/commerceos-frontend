'use client';

import { useEffect, useRef, useState } from 'react';
import { LuPlus, LuGripVertical, LuArrowUp, LuArrowDown, LuExternalLink, LuPencil, LuTrash2, LuLink, LuImage, LuX, LuRefreshCw } from 'react-icons/lu';
import MediaPicker from '@/components/media/media-picker';

type Banner = { id: string; title: string; imageUrl: string; alt: string; href: string; active: boolean };
type BannerDocument = { slides: Banner[]; version: number };
const endpoint = '/api/v1/auth/collection-banners';

function BannerEditor({ initial, busy, onSave, onClose }: { initial: Banner; busy: boolean; onSave: (banner: Banner) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => { titleInput.current?.focus(); titleInput.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, []);

  return <section className="hero-slider-editor" aria-labelledby="banner-editor-title">
    <div className="hero-slider-editor-heading"><h2 id="banner-editor-title">{initial.imageUrl ? 'Edit Banner' : 'Add New Banner'}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close banner editor"><LuX /></button></div>
    <form onSubmit={event => { event.preventDefault(); void onSave(draft); }}><fieldset disabled={busy}>
      <div className="hero-slider-form-grid"><div>
        <label>Title<input ref={titleInput} value={draft.title} maxLength={120} placeholder="e.g. Football collection" onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
        <label>Destination link<input value={draft.href} maxLength={2000} placeholder="/products or https://example.com/collection" onChange={event => setDraft({ ...draft, href: event.target.value })} /><small>Optional. Opens when a customer clicks this banner.</small></label>
        <label>Image description (alt text)<input value={draft.alt} maxLength={250} placeholder="Describe the banner for screen readers" onChange={event => setDraft({ ...draft, alt: event.target.value })} /></label>
        <label className="hero-slider-checkbox"><input type="checkbox" checked={draft.active} onChange={event => setDraft({ ...draft, active: event.target.checked })} />Active — show on the website</label>
      </div><div>
        <div className="hero-slider-image-preview">{draft.imageUrl ? <>{/* eslint-disable-next-line @next/next/no-img-element -- Existing media service URLs. */}<img src={draft.imageUrl} alt={draft.alt || draft.title || 'Banner preview'} /></> : <div><LuImage /><span>Choose a collection banner</span></div>}</div>
        <button className="hero-slider-media-button" type="button" onClick={() => setPickerOpen(true)}><LuImage />Choose / upload image</button>
        <label>Image URL<input value={draft.imageUrl} required maxLength={2000} placeholder="https://…" onChange={event => setDraft({ ...draft, imageUrl: event.target.value })} /><small>Use a 16:9 collection image, ideally 1000 × 560 px. The storefront keeps the supplied template crop.</small></label>
      </div></div>
      <div className="hero-slider-form-actions"><button type="button" onClick={onClose}>Cancel</button><button className="hero-slider-primary" type="submit">{busy ? 'Saving…' : 'Save Banner'}</button></div>
    </fieldset></form>
    <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} mediaType="image" currentUrl={draft.imageUrl} onSelect={(item: { url: string; altText?: string }) => { setDraft({ ...draft, imageUrl: item.url, alt: draft.alt || item.altText || '' }); setPickerOpen(false); }} />
  </section>;
}

export function CollectionBannersManager({ storefrontUrl }: { storefrontUrl: string }) {
  const [document, setDocument] = useState<BannerDocument | null>(null);
  const [editor, setEditor] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [reload, setReload] = useState(0);
  const dragging = useRef<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not load banners.');
      setDocument(result.data); setError(''); setConflict(false);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message || 'Could not load banners.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const reloadList = () => {
    if (editor && !window.confirm('Discard the current banner edit and reload?')) return;
    setEditor(null); setLoading(true); setReload(value => value + 1);
  };
  const save = async (slides: Banner[], message: string) => {
    if (!document || saving.current || conflict) return false;
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slides, version: document.version }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (response.status === 409) setConflict(true);
      if (!response.ok) throw new Error(result.error?.message || 'Could not save banners.');
      setDocument(result.data); setNotice(message); return true;
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save banners.'); return false; }
    finally { saving.current = false; setBusy(false); }
  };
  const move = (id: string, target: number) => {
    if (!document || editor) return;
    const slides = [...document.slides];
    const source = slides.findIndex(item => item.id === id);
    if (source < 0 || target < 0 || target >= slides.length || target === source) return;
    slides.splice(target, 0, slides.splice(source, 1)[0]);
    void save(slides, 'Banner order updated.');
  };
  const disabled = busy || loading || conflict;

  return <section className="hero-slider-management">
    <div className="hero-slider-page-heading"><div><h1>Collection Banner Management</h1><p>Manage the homepage collection image carousel</p></div><button className="hero-slider-primary" disabled={disabled || !document || !!editor || document.slides.length >= 50} onClick={() => { setNotice(''); setEditor({ id: crypto.randomUUID(), title: '', imageUrl: '', alt: '', href: '', active: true }); }}><LuPlus />Add New Banner</button></div>
    {error && <div className="hero-slider-error" role="alert">{error}<button disabled={busy || loading} onClick={reloadList}><LuRefreshCw />Reload banners</button></div>}
    {notice && <p className="hero-slider-notice" role="status">{notice}</p>}
    {editor && <BannerEditor key={editor.id} initial={editor} busy={busy || conflict} onClose={() => setEditor(null)} onSave={async banner => {
      if (!document) return;
      const existing = document.slides.some(item => item.id === banner.id);
      const slides = existing ? document.slides.map(item => item.id === banner.id ? banner : item) : [...document.slides, banner];
      if (await save(slides, existing ? 'Banner updated.' : 'Banner added.')) setEditor(null);
    }} />}
    <div className="hero-slider-list-panel"><h2>Current Collection Banners</h2>
      {loading ? <p role="status">Loading banners…</p> : !document ? <p>Banners could not be loaded. Use Reload banners to try again.</p> : document.slides.length === 0 ? <div className="hero-slider-empty"><LuImage /><h3>No banners yet</h3><p>Add your first collection image using Add New Banner.</p></div> : <div className="hero-slider-list">
        {document.slides.map((banner, index) => <article className="hero-slider-row" key={banner.id} onDragOver={event => { if (dragging.current && !disabled && !editor) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (dragging.current && !disabled && !editor) move(dragging.current, index); dragging.current = null; }}>
          <div className="hero-slider-position"><button className="hero-slider-drag" draggable={!disabled && !editor} disabled={disabled || !!editor} onDragStart={event => { dragging.current = banner.id; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', banner.id); }} onDragEnd={() => { dragging.current = null; }} aria-label={`Drag ${banner.title || 'Untitled Banner'} to reorder`} title="Drag to reorder; or use the arrow buttons"><LuGripVertical /></button><span>{index + 1}</span></div>
          {/* eslint-disable-next-line @next/next/no-img-element -- Existing media service URLs. */}<img className="hero-slider-thumbnail" src={banner.imageUrl} alt={banner.alt || banner.title || 'Collection banner'} />
          <div className="hero-slider-details"><h3>{banner.title || 'Untitled Banner'}</h3><div className="hero-slider-meta">{banner.href ? <a href={new URL(banner.href, storefrontUrl).href} target="_blank" rel="noopener noreferrer"><LuLink /><span>{banner.href}</span></a> : <span className="hero-slider-no-link">No destination link</span>}<button className={`hero-slider-status${banner.active ? ' is-active' : ''}`} disabled={disabled || !!editor} aria-label={`${banner.active ? 'Deactivate' : 'Activate'} ${banner.title || 'banner'}`} onClick={() => void save(document.slides.map(item => item.id === banner.id ? { ...item, active: !item.active } : item), banner.active ? 'Banner deactivated.' : 'Banner activated.')}>{banner.active ? 'Active' : 'Inactive'}</button></div></div>
          <div className="hero-slider-row-actions">
            <button disabled={disabled || !!editor || index === 0} title="Move up" aria-label={`Move banner ${index + 1} up`} onClick={() => move(banner.id, index - 1)}><LuArrowUp /></button>
            <button disabled={disabled || !!editor || index === document.slides.length - 1} title="Move down" aria-label={`Move banner ${index + 1} down`} onClick={() => move(banner.id, index + 1)}><LuArrowDown /></button>
            <a className="hero-slider-open" href={banner.href ? new URL(banner.href, storefrontUrl).href : banner.imageUrl} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${banner.title || 'banner'}`} title="Open destination"><LuExternalLink /></a>
            <button className="hero-slider-edit" disabled={disabled || !!editor} title="Edit banner" aria-label={`Edit ${banner.title || 'banner'}`} onClick={() => { setNotice(''); setEditor(banner); }}><LuPencil /></button>
            <button className="hero-slider-delete" disabled={disabled || !!editor} title="Delete banner" aria-label={`Delete ${banner.title || 'banner'}`} onClick={() => { if (window.confirm(`Delete “${banner.title || 'Untitled Banner'}”? The uploaded image will remain in the media library.`)) void save(document.slides.filter(item => item.id !== banner.id), 'Banner deleted.'); }}><LuTrash2 /></button>
          </div>
        </article>)}
      </div>}
      <p className="hero-slider-hint">Drag to reorder or use the arrows. Only active banners appear on the website. Reload the website to see saved changes.</p>
    </div>
  </section>;
}
