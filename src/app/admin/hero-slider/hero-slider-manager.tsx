'use client';

import { useEffect, useRef, useState } from 'react';
import { LuPlus, LuGripVertical, LuArrowUp, LuArrowDown, LuExternalLink, LuPencil, LuTrash2, LuLink, LuImage, LuX, LuRefreshCw } from 'react-icons/lu';
import MediaPicker from '@/components/media/media-picker';

type Slide = { id: string; title: string; imageUrl: string; alt: string; href: string; active: boolean };
type SliderDocument = { slides: Slide[]; version: number };
const endpoint = '/api/v1/auth/hero-sliders';

function SliderEditor({ initial, busy, onSave, onClose }: { initial: Slide; busy: boolean; onSave: (slide: Slide) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => { titleInput.current?.focus(); titleInput.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, []);
  return <section className="hero-slider-editor" aria-labelledby="slider-editor-title">
    <div className="hero-slider-editor-heading"><h2 id="slider-editor-title">{initial.imageUrl ? 'Edit Slider' : 'Add New Slider'}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close slider editor"><LuX /></button></div>
    <form onSubmit={event => { event.preventDefault(); void onSave(draft); }}>
      <fieldset disabled={busy}>
        <div className="hero-slider-form-grid"><div>
          <label>Title<input ref={titleInput} value={draft.title} maxLength={120} placeholder="e.g. Football collection" onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
          <label>Destination link<input value={draft.href} maxLength={2000} placeholder="/products or https://example.com/collection" onChange={event => setDraft({ ...draft, href: event.target.value })} /><small>Optional. Opens when a customer clicks this banner.</small></label>
          <label>Image description (alt text)<input value={draft.alt} maxLength={250} placeholder="Describe the banner for screen readers" onChange={event => setDraft({ ...draft, alt: event.target.value })} /></label>
          <label className="hero-slider-checkbox"><input type="checkbox" checked={draft.active} onChange={event => setDraft({ ...draft, active: event.target.checked })} />Active — show on the website</label>
        </div><div>
          <div className="hero-slider-image-preview">{draft.imageUrl ? <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Existing media service URLs. */}
            <img src={draft.imageUrl} alt={draft.alt || draft.title || 'Slider preview'} />
          </> : <div><LuImage /><span>Choose a slider banner</span></div>}</div>
          <button className="hero-slider-media-button" type="button" onClick={() => setPickerOpen(true)}><LuImage />Choose / upload image</button>
          <label>Image URL<input value={draft.imageUrl} required maxLength={2000} placeholder="https://…" onChange={event => setDraft({ ...draft, imageUrl: event.target.value })} /><small>Use a wide banner, ideally 1800 × 600 px. Keep important content near the centre for mobile cropping.</small></label>
        </div></div>
        <div className="hero-slider-form-actions"><button type="button" onClick={onClose}>Cancel</button><button className="hero-slider-primary" type="submit">{busy ? 'Saving…' : 'Save Slider'}</button></div>
      </fieldset>
    </form>
    <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} mediaType="image" currentUrl={draft.imageUrl} onSelect={(item: { url: string; altText?: string }) => { setDraft({ ...draft, imageUrl: item.url, alt: draft.alt || item.altText || '' }); setPickerOpen(false); }} />
  </section>;
}

export function HeroSliderManager({ storefrontUrl }: { storefrontUrl: string }) {
  const [document, setDocument] = useState<SliderDocument | null>(null);
  const [editor, setEditor] = useState<Slide | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const dragging = useRef<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not load sliders.');
      setDocument(result.data); setError(''); setConflict(false);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message || 'Could not load sliders.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const reloadList = () => {
    if (editor && !window.confirm('Discard the current slider edit and reload?')) return;
    setEditor(null); setLoading(true); setReload(value => value + 1);
  };
  const save = async (slides: Slide[], message: string) => {
    if (!document || saving.current || conflict) return false;
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slides, version: document.version }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (response.status === 409) setConflict(true);
      if (!response.ok) throw new Error(result.error?.message || 'Could not save sliders.');
      setDocument(result.data); setNotice(message); return true;
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save sliders.'); return false; }
    finally { saving.current = false; setBusy(false); }
  };
  const move = (id: string, target: number) => {
    if (!document || editor) return;
    const slides = [...document.slides];
    const source = slides.findIndex(slide => slide.id === id);
    if (source < 0 || target < 0 || target >= slides.length || target === source) return;
    slides.splice(target, 0, slides.splice(source, 1)[0]);
    void save(slides, 'Slider order updated.');
  };
  const disabled = busy || loading || conflict;

  return <section className="hero-slider-management">
    <div className="hero-slider-page-heading"><div><h1>Hero Slider Management</h1><p>Manage homepage hero slider banners</p></div><button className="hero-slider-primary" disabled={disabled || !document || !!editor || document.slides.length >= 50} onClick={() => { setNotice(''); setEditor({ id: crypto.randomUUID(), title: '', imageUrl: '', alt: '', href: '', active: true }); }}><LuPlus />Add New Slider</button></div>
    {error && <div className="hero-slider-error" role="alert">{error}<button disabled={busy || loading} onClick={reloadList}><LuRefreshCw />Reload sliders</button></div>}
    {notice && <p className="hero-slider-notice" role="status">{notice}</p>}
    {editor && <SliderEditor key={editor.id} initial={editor} busy={busy || conflict} onClose={() => setEditor(null)} onSave={async slide => {
      if (!document) return;
      const existing = document.slides.some(item => item.id === slide.id);
      const slides = existing ? document.slides.map(item => item.id === slide.id ? slide : item) : [...document.slides, slide];
      if (await save(slides, existing ? 'Slider updated.' : 'Slider added.')) setEditor(null);
    }} />}
    <div className="hero-slider-list-panel"><h2>Current Hero Sliders</h2>
      {loading ? <p role="status">Loading sliders…</p> : !document ? <p>Sliders could not be loaded. Use Reload sliders to try again.</p> : document.slides.length === 0 ? <div className="hero-slider-empty"><LuImage /><h3>No sliders yet</h3><p>Add your first homepage banner using Add New Slider.</p></div> : <div className="hero-slider-list">
        {document.slides.map((slide, index) => <article className="hero-slider-row" key={slide.id} onDragOver={event => { if (dragging.current && !disabled && !editor) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (dragging.current && !disabled && !editor) move(dragging.current, index); dragging.current = null; }}>
          <div className="hero-slider-position"><button className="hero-slider-drag" draggable={!disabled && !editor} disabled={disabled || !!editor} onDragStart={event => { dragging.current = slide.id; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', slide.id); }} onDragEnd={() => { dragging.current = null; }} aria-label={`Drag ${slide.title || 'Untitled Slider'} to reorder`} title="Drag to reorder; or use the arrow buttons"><LuGripVertical /></button><span>{index + 1}</span></div>
          {/* eslint-disable-next-line @next/next/no-img-element -- Existing media service URLs. */}
          <img className="hero-slider-thumbnail" src={slide.imageUrl} alt={slide.alt || slide.title || 'Slider banner'} />
          <div className="hero-slider-details"><h3>{slide.title || 'Untitled Slider'}</h3><div className="hero-slider-meta">{slide.href ? <a href={new URL(slide.href, storefrontUrl).href} target="_blank" rel="noopener noreferrer"><LuLink /><span>{slide.href}</span></a> : <span className="hero-slider-no-link">No destination link</span>}<button className={`hero-slider-status${slide.active ? ' is-active' : ''}`} disabled={disabled || !!editor} aria-label={`${slide.active ? 'Deactivate' : 'Activate'} ${slide.title || 'slider'}`} onClick={() => void save(document.slides.map(item => item.id === slide.id ? { ...item, active: !item.active } : item), slide.active ? 'Slider deactivated.' : 'Slider activated.')}>{slide.active ? 'Active' : 'Inactive'}</button></div></div>
          <div className="hero-slider-row-actions">
            <button disabled={disabled || !!editor || index === 0} title="Move up" aria-label={`Move slider ${index + 1} up`} onClick={() => move(slide.id, index - 1)}><LuArrowUp /></button>
            <button disabled={disabled || !!editor || index === document.slides.length - 1} title="Move down" aria-label={`Move slider ${index + 1} down`} onClick={() => move(slide.id, index + 1)}><LuArrowDown /></button>
            <a className="hero-slider-open" href={slide.href ? new URL(slide.href, storefrontUrl).href : slide.imageUrl} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${slide.title || 'slider'}`} title="Open destination"><LuExternalLink /></a>
            <button className="hero-slider-edit" disabled={disabled || !!editor} title="Edit slider" aria-label={`Edit ${slide.title || 'slider'}`} onClick={() => { setNotice(''); setEditor(slide); }}><LuPencil /></button>
            <button className="hero-slider-delete" disabled={disabled || !!editor} title="Delete slider" aria-label={`Delete ${slide.title || 'slider'}`} onClick={() => { if (window.confirm(`Delete “${slide.title || 'Untitled Slider'}”? The uploaded image will remain in the media library.`)) void save(document.slides.filter(item => item.id !== slide.id), 'Slider deleted.'); }}><LuTrash2 /></button>
          </div>
        </article>)}
      </div>}
      <p className="hero-slider-hint">Drag to reorder or use the arrows. Only active sliders appear on the website. Reload the website to see saved changes.</p>
    </div>
  </section>;
}
