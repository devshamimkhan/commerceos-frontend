'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { LuImage as ImageIcon, LuPalette as Palette, LuRotateCcw as RotateCcw, LuSave as Save, LuTrash2 as Trash, LuUpload as Upload } from 'react-icons/lu';
import MediaPickerModal from '@/components/media/media-picker';
import {
  ADMIN_THEME_UPDATED_EVENT,
  DEFAULT_ADMIN_THEME,
  type AdminThemeSettings,
} from '@/lib/admin-theme';

type ThemeKey = keyof AdminThemeSettings;
type BrandAssetKey = 'adminLogoUrl' | 'adminFaviconUrl';
type ColorThemeKey = Exclude<ThemeKey, 'buttonRadius' | BrandAssetKey>;

const groups: { title: string; description: string; fields: { key: ColorThemeKey; label: string; help: string }[] }[] = [
  {
    title: 'Brand colors',
    description: 'Used for navigation, links, highlights and active states.',
    fields: [
      { key: 'primary', label: 'Primary', help: 'Main action and navigation color.' },
      { key: 'secondary', label: 'Secondary', help: 'Sidebar gradient and supporting brand color.' },
      { key: 'accent', label: 'Accent', help: 'Highlights, links and focus states.' },
    ],
  },
  {
    title: 'Button styles',
    description: 'Controls primary, secondary and destructive buttons throughout the admin panel.',
    fields: [
      { key: 'buttonPrimaryBackground', label: 'Primary background', help: 'Create, save, apply and main action buttons.' },
      { key: 'buttonPrimaryHover', label: 'Primary hover', help: 'Primary button hover and pressed state.' },
      { key: 'buttonPrimaryText', label: 'Primary text', help: 'Text and icons on primary buttons.' },
      { key: 'buttonSecondaryBackground', label: 'Secondary background', help: 'Browse, change, pagination and supporting actions.' },
      { key: 'buttonSecondaryHover', label: 'Secondary hover', help: 'Secondary button hover and pressed state.' },
      { key: 'buttonSecondaryText', label: 'Secondary text', help: 'Text and icons on secondary buttons.' },
      { key: 'buttonDangerBackground', label: 'Danger background', help: 'Remove, delete and destructive buttons.' },
      { key: 'buttonDangerHover', label: 'Danger hover', help: 'Destructive button hover and pressed state.' },
      { key: 'buttonDangerText', label: 'Danger text', help: 'Text and icons on destructive buttons.' },
    ],
  },
  {
    title: 'Interface colors',
    description: 'Controls the light theme canvas, cards and typography.',
    fields: [
      { key: 'pageBackground', label: 'Page background', help: 'Admin workspace background.' },
      { key: 'surface', label: 'Card surface', help: 'Panels, cards and table surfaces.' },
      { key: 'heading', label: 'Heading text', help: 'Page and section headings.' },
      { key: 'text', label: 'Body text', help: 'Default interface text.' },
      { key: 'muted', label: 'Muted text', help: 'Descriptions and secondary labels.' },
    ],
  },
  {
    title: 'Status colors',
    description: 'Shared colors for success, warning and destructive states.',
    fields: [
      { key: 'success', label: 'Success', help: 'Delivered, published and successful states.' },
      { key: 'warning', label: 'Warning', help: 'Pending and attention states.' },
      { key: 'danger', label: 'Danger', help: 'Cancelled, errors and destructive actions.' },
      { key: 'info', label: 'Information', help: 'Processing and informational states.' },
    ],
  },
];

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export function ThemeSettingsEditor({ initialTheme }: { initialTheme: AdminThemeSettings }) {
  const [theme, setTheme] = useState(initialTheme);
  const [saving, setSaving] = useState(false);
  const [assetPicker, setAssetPicker] = useState<BrandAssetKey | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateColor(key: ThemeKey, value: string) {
    setTheme(current => ({ ...current, [key]: value }));
    setMessage('');
    setError('');
  }

  async function saveTheme() {
    const colorKeys = groups.flatMap(group => group.fields.map(field => field.key));
    if (colorKeys.some(key => !HEX_PATTERN.test(theme[key]))) {
      setError('Enter each color as a six-digit hex value, for example #7c3aed.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/v1/auth/theme-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(theme),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null) as { data?: AdminThemeSettings; error?: { message?: string } } | null;
      if (!response.ok || !result?.data) throw new Error(result?.error?.message ?? 'Unable to save theme settings.');
      setTheme(result.data);
      window.dispatchEvent(new CustomEvent(ADMIN_THEME_UPDATED_EVENT, { detail: result.data }));
      setMessage('Theme settings saved and applied.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save theme settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="theme-settings-page">
      <header className="theme-settings-heading">
        <div className="theme-settings-heading-icon"><Palette aria-hidden="true" /></div>
        <div><h2>Theme Settings</h2><p>Manage the CommerceXLab admin palette from one central module.</p></div>
      </header>

      <div className="theme-settings-layout">
        <div className="theme-settings-groups">
          <section className="theme-settings-card">
            <header><h3>Admin branding</h3><p>Upload the logo and browser favicon used throughout the admin panel.</p></header>
            <div className="theme-brand-grid">
              <BrandAssetField
                title="Admin brand logo"
                help="Shown at the top of the admin sidebar. A transparent PNG or WebP works best."
                value={theme.adminLogoUrl}
                previewClassName="theme-brand-logo-preview"
                onChoose={() => setAssetPicker('adminLogoUrl')}
                onRemove={() => updateColor('adminLogoUrl', '')}
              />
              <BrandAssetField
                title="Admin favicon"
                help="Shown in the browser tab and used as the collapsed sidebar icon. Use a square image."
                value={theme.adminFaviconUrl}
                previewClassName="theme-brand-favicon-preview"
                onChoose={() => setAssetPicker('adminFaviconUrl')}
                onRemove={() => updateColor('adminFaviconUrl', '')}
              />
            </div>
          </section>
          {groups.map(group => (
            <section className="theme-settings-card" key={group.title}>
              <header><h3>{group.title}</h3><p>{group.description}</p></header>
              <div className="theme-color-grid">
                {group.fields.map(field => (
                  <label className="theme-color-field" key={field.key}>
                    <span className="theme-color-label">{field.label}</span>
                    <span className="theme-color-control">
                      <input type="color" value={HEX_PATTERN.test(theme[field.key]) ? theme[field.key] : '#000000'} onChange={event => updateColor(field.key, event.target.value)} aria-label={`${field.label} color picker`} />
                      <input type="text" value={theme[field.key]} onChange={event => updateColor(field.key, event.target.value)} maxLength={7} spellCheck={false} aria-label={`${field.label} hex color`} />
                    </span>
                    <small>{field.help}</small>
                  </label>
                ))}
              </div>
              {group.title === 'Button styles' && (
                <label className="theme-radius-field">
                  <span><strong>Button corner radius</strong><small>Applies to primary, secondary and destructive buttons.</small></span>
                  <span className="theme-radius-control"><input type="range" min="0" max="24" step="1" value={theme.buttonRadius} onChange={event => setTheme(current => ({ ...current, buttonRadius: Number(event.target.value) }))} /><output>{theme.buttonRadius}px</output></span>
                </label>
              )}
            </section>
          ))}
        </div>

        <aside className="theme-preview-card" style={{ '--preview-primary': theme.primary, '--preview-secondary': theme.secondary, '--preview-accent': theme.accent, '--preview-bg': theme.pageBackground, '--preview-surface': theme.surface, '--preview-heading': theme.heading, '--preview-text': theme.text, '--preview-muted': theme.muted, '--preview-button-bg': theme.buttonPrimaryBackground, '--preview-button-text': theme.buttonPrimaryText, '--preview-button-radius': `${theme.buttonRadius}px` } as CSSProperties}>
          <span className="theme-preview-eyebrow">Live preview</span>
          <div className="theme-preview-window">
            <div className="theme-preview-sidebar"><span /><span /><span /></div>
            <div className="theme-preview-content"><h3>CommerceXLab</h3><p>Central admin theme</p><div className="theme-preview-panels"><span /><span /></div><button type="button">Primary action</button></div>
          </div>
          <p>Preview changes here, then save to apply them across the admin panel.</p>
        </aside>
      </div>

      <div className="theme-settings-savebar">
        <div aria-live="polite">{error && <p className="theme-settings-error">{error}</p>}{message && <p className="theme-settings-success">{message}</p>}</div>
        <div className="theme-settings-actions">
          <button type="button" className="theme-reset-button" onClick={() => { setTheme(DEFAULT_ADMIN_THEME); setMessage('Defaults loaded. Save to apply them.'); setError(''); }} disabled={saving}><RotateCcw /> Restore defaults</button>
          <button type="button" className="admin-primary-action" onClick={saveTheme} disabled={saving}><Save /> {saving ? 'Saving…' : 'Save theme'}</button>
        </div>
      </div>
      <MediaPickerModal
        open={assetPicker !== null}
        onClose={() => setAssetPicker(null)}
        mediaType="image"
        currentUrl={assetPicker ? theme[assetPicker] : ''}
        onSelect={(item: { url: string }) => {
          if (assetPicker) updateColor(assetPicker, item.url);
          setAssetPicker(null);
        }}
      />
    </section>
  );
}

function BrandAssetField({ title, help, value, previewClassName, onChoose, onRemove }: {
  title: string;
  help: string;
  value: string;
  previewClassName: string;
  onChoose: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="theme-brand-field">
      <div className={`theme-brand-preview ${previewClassName}`}>
        {value
          ? <Image unoptimized src={value} alt={`${title} preview`} width={360} height={160} />
          : <span><ImageIcon aria-hidden="true" /><small>No image selected</small></span>}
      </div>
      <div className="theme-brand-copy"><strong>{title}</strong><small>{help}</small></div>
      <div className="theme-brand-actions">
        <button type="button" className="admin-secondary-action" onClick={onChoose}><Upload /> {value ? 'Change image' : 'Choose or upload'}</button>
        {value && <button type="button" className="admin-danger-action" onClick={onRemove} aria-label={`Remove ${title}`}><Trash /> Remove</button>}
      </div>
    </article>
  );
}
