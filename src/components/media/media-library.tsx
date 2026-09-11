/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy media library migration; remove after shared media types are consolidated.
'use client';
import Icon from '@/components/media/library-icon';
import Image from 'next/image';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { uploadFiles, uploaderFetch, mediaApi as api } from '@/lib/media-client';
import toast from 'react-hot-toast';


const ACCEPTED_FILES = '.jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.csv';
const PAGE_SIZE = 24;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function MediaPreview({ item, className = '', altText = '' }) {
  if (item.mediaType === 'image') {
    return <Image unoptimized width={640} height={480} src={item.url} alt={altText || item.originalName} className={className || 'h-full w-full object-cover'} />;
  }
  if (item.mediaType === 'video') {
    return (
      <video className={className || 'h-full w-full object-cover'} muted preload="metadata">
        <source src={item.url} type={item.mimeType} />
      </video>
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-blue-50 text-blue-600 ${className}`}>
      <Icon className="fas fa-file-pdf text-3xl"></Icon>
    </div>
  );
}

export default function MediaLibraryClient() {
  const fileInputRef = useRef(null);
  const requestRef = useRef(0);
  const uploadBusy = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const replaceInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState({ search: '', type: '', month: '', page: 1 });
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [view, setView] = useState('grid');
  const [selectionMode, setSelectionMode] = useState('multiple');
  const [selectedIds, setSelectedIds] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);
  const [altTextValue, setAltTextValue] = useState('');
  const [altTextSaving, setAltTextSaving] = useState(false);
  const [altTextSaved, setAltTextSaved] = useState(false);

  const canBulkDelete = selectedIds.length > 0;

  function pushToast(message, type = 'success') {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  }

  const fetchMedia = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(query.page),
        limit: String(PAGE_SIZE),
      });
      if (query.search.trim()) params.set('search', query.search.trim());
      if (query.type) params.set('type', query.type);
      if (query.month) params.set('month', query.month);

      const res = await uploaderFetch(`/api/media?${params.toString()}`, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load media');

      if (requestId !== requestRef.current) return;
      if (query.page > (data.pages || 1)) { setQuery(prev => ({ ...prev, page: data.pages || 1 })); return; }
      setItems(data.items || []);
      setMeta({ total: data.total || 0, pages: data.pages || 1 });
      setSelectedIds((prev) => prev.filter((id) => (data.items || []).some((item) => item.id === id)));
    } catch (error) {
      pushToast(error.message || 'Failed to load media', 'error');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(fetchMedia, 300);
    return () => { clearTimeout(timer); };
  }, [fetchMedia]);

  useEffect(() => {
    if (!detailItem) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const modal = document.querySelector('[data-media-details]');
    const focusable = () => Array.from(modal?.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]') || []);
    focusable()[0]?.focus();
    const listener = event => {
      if (event.key === 'Escape') setDetailItem(null);
      if (event.key === 'Tab') {
        const elements = focusable(), first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', listener);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', listener); previous?.focus(); };
  }, [detailItem]);

  function setSingleSelection(id) {
    if (selectionMode === 'single') {
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((current) => current !== id) : [...prev, id]));
  }

  function openDetails(item) {
    setDetailItem(item);
    setRenameValue(item.originalName.replace(/\.[^.]+$/, ''));
    setAltTextValue(item.altText || '');
    setAltTextSaved(false);

  }

  async function handleUpload(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || uploadBusy.current) return;
    uploadBusy.current = true;
    setUploading(true);
    try {
      await uploadFiles(files);
      pushToast(`${files.length} file(s) uploaded`);
      setQuery((prev) => ({ ...prev, page: 1 }));
    } catch (error) {
      pushToast(error.message || 'Upload failed', 'error');
    } finally {
      uploadBusy.current = false;
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    const ok = confirm('Delete selected media item?');
    if (!ok || deleting) return;
    setDeleting(true);
    try {
      const res = await uploaderFetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      pushToast('Media deleted');
      if (detailItem?.id === id) setDetailItem(null);
      await fetchMedia();
    } catch (error) {
      pushToast(error.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    const ok = confirm(`Delete ${selectedIds.length} selected item(s)?`);
    if (!ok || deleting) return;
    setDeleting(true);
    try {
      const res = await uploaderFetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed');
      pushToast('Selected media deleted');
      setSelectedIds([]);
      setDetailItem(null);
      await fetchMedia();
    } catch (error) {
      pushToast(error.message || 'Bulk delete failed', 'error');
    } finally { setDeleting(false); }
  }

  async function saveAltText() {
    if (!detailItem) return;
    setAltTextSaving(true);
    try {
      await api.put('/media-alt', {
        url: detailItem.url,
        altText: altTextValue.trim(),
        mediaId: detailItem.id,
        fileName: detailItem.originalName,
      });
      setItems(prev => prev.map(item => item.id === detailItem.id ? { ...item, altText: altTextValue.trim() } : item));
      setAltTextSaved(true);
      pushToast('Alt text saved');
      setTimeout(() => setAltTextSaved(false), 2500);
    } catch (error) {
      pushToast(error.message || 'Failed to save alt text', 'error');
    } finally {
      setAltTextSaving(false);
    }
  }

  async function saveRenameAndMaybeReplace(file) {
    if (!detailItem) return;
    setSavingDetail(true);
    try {
      const formData = new FormData();
      formData.set('name', renameValue.trim());
      if (file) formData.set('file', file);

      await api.put('/media-alt', { mediaId: detailItem.id, altText: altTextValue.trim() });
      const res = await uploaderFetch(`/api/media/${detailItem.id}`, { method: 'PUT', body: formData });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      const updated = data.item;
      setDetailItem(updated);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      pushToast(file ? 'File replaced' : 'Media updated');
    } catch (error) {
      pushToast(error.message || 'Update failed', 'error');
    } finally {
      setSavingDetail(false);
    }
  }

  const selectedCountText = useMemo(() => {
    if (selectionMode === 'single') return selectedIds.length ? '1 selected' : 'No selection';
    return `${selectedIds.length} selected`;
  }, [selectedIds.length, selectionMode]);

  return (
    <div className="media-library space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#103456]">Media Library</h1>
          <p className="text-sm text-blue-500">WordPress-style library for image, video, PDF and CSV assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></Icon>
            {uploading ? 'Uploading...' : 'Add New Media'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            multiple
            style={{ display: 'none' }}
            onChange={(event) => {
              handleUpload(event.target.files);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleUpload(event.dataTransfer.files);
        }}
        className={`card border-2 border-dashed p-4 transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="media-upload-icon h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Icon className="fas fa-folder-open"></Icon>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#103456]">Drag and drop files here</p>
              <p className="text-xs text-blue-500">Allowed: JPG, PNG, WEBP, MP4, MOV, PDF, CSV</p>
            </div>
          </div>
          <div className="text-xs text-blue-500">
            {meta.total} total files
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#103456]">Search & Filters</h2>
            <p className="text-xs text-blue-500">Find files by name, type, or upload month.</p>
          </div>
          {(query.search || query.type || query.month) && (
            <button
              type="button"
              className="action-btn bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => setQuery((prev) => ({ ...prev, page: 1, search: '', type: '', month: '' }))}
            >
              <Icon className="fas fa-undo-alt"></Icon> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6">
            <input
              className="form-input"
              placeholder="Search by file name..."
              value={query.search}
              onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, search: event.target.value }))}
            />
          </div>
          <div className="lg:col-span-3">
            <select
              className="form-input w-full"
              value={query.type}
              onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, type: event.target.value }))}
            >
              <option value="">All Types</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <input
              className="form-input w-full"
              type="month"
              aria-label="Filter by upload month"
              value={query.month}
              onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, month: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-blue-600 font-medium">Selection Mode</span>
            <button
              type="button"
              onClick={() => {
                setSelectionMode('single');
                setSelectedIds((prev) => (prev.length ? [prev[0]] : []));
              }}
              className={`action-btn ${selectionMode === 'single' ? 'action-view' : 'bg-slate-100 text-slate-600'}`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode('multiple')}
              className={`action-btn ${selectionMode === 'multiple' ? 'action-view' : 'bg-slate-100 text-slate-600'}`}
            >
              Multiple
            </button>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700 font-medium">{selectedCountText}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`action-btn ${view === 'grid' ? 'action-view' : 'bg-slate-100 text-slate-600'}`}
              >
                <Icon className="fas fa-th"></Icon> Grid
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`action-btn ${view === 'list' ? 'action-view' : 'bg-slate-100 text-slate-600'}`}
              >
                <Icon className="fas fa-list"></Icon> List
              </button>
            </div>
            <button
              type="button"
              disabled={!canBulkDelete || deleting}
              onClick={handleBulkDelete}
              className={`action-btn ${canBulkDelete ? 'action-delete' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              <Icon className="fas fa-trash"></Icon> Bulk Delete
            </button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-blue-100 bg-blue-50 h-32"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-blue-400">
            <Icon className="fas fa-folder-open text-3xl mb-3 block"></Icon>
            No media found for the current filters.
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition overflow-hidden ${
                    selected ? 'border-blue-500 shadow-md shadow-blue-100' : 'border-blue-100 hover:border-blue-300'
                  }`}
                >
                  <button
                    type="button"
                    className="relative w-full h-28 bg-slate-50"
                    onClick={() => openDetails(item)}
                  >
                    <MediaPreview item={item} />
                    <span className="media-type-badge absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      {item.mediaType.toUpperCase()}
                    </span>
                  </button>
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <input
                        type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                        checked={selected}
                        onChange={() => setSingleSelection(item.id)}
                        aria-label={`Select ${item.originalName}`}
                        name={selectionMode === 'single' ? 'single-media' : undefined}
                      />
                      <p className="truncate text-xs text-slate-700">{item.originalName}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-blue-400">{formatBytes(item.size)}</span>
                      <button type="button" className="action-btn action-view" onClick={() => openDetails(item)}>
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Preview</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                        checked={selectedIds.includes(item.id)}
                        onChange={() => setSingleSelection(item.id)}
                        name={selectionMode === 'single' ? 'single-media' : undefined}
                      />
                    </td>
                    <td>
                      <div className="h-12 w-16 overflow-hidden rounded bg-blue-50 border border-blue-100">
                        <MediaPreview item={item} />
                      </div>
                    </td>
                    <td>{item.originalName}</td>
                    <td><span className="badge badge-upcoming">{item.mediaType}</span></td>
                    <td>{formatBytes(item.size)}</td>
                    <td>{new Date(item.uploadedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" className="action-btn action-view" onClick={() => openDetails(item)}>
                          <Icon className="fas fa-eye"></Icon>
                        </button>
                        <button type="button" className="action-btn action-delete" onClick={() => handleDelete(item.id)}>
                          <Icon className="fas fa-trash"></Icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-500">
          Page {query.page} of {meta.pages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-outline"
            disabled={query.page <= 1}
            onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
          >
            <Icon className="fas fa-chevron-left"></Icon> Previous
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={query.page >= meta.pages}
            onClick={() => setQuery((prev) => ({ ...prev, page: Math.min(prev.page + 1, meta.pages) }))}
          >
            Next <Icon className="fas fa-chevron-right"></Icon>
          </button>
        </div>
      </div>

      {detailItem && (
        <div className="modal-backdrop open" onClick={() => setDetailItem(null)}>
          <div role="dialog" aria-modal="true" aria-label="Attachment Details" data-media-details className="modal-box max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#103456]">Attachment Details</h3>
              <button type="button" className="action-btn action-delete" onClick={() => setDetailItem(null)}>
                <Icon className="fas fa-times"></Icon>
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-blue-100 bg-slate-50 overflow-hidden h-64">
                <MediaPreview item={detailItem} altText={altTextValue} />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-blue-500 mb-1">File name</label>
                  <input
                    className="form-input"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-500 mb-1">
                    Alt Text (SEO)
                    <span
                      className={`ml-2 text-[10px] font-medium ${
                        altTextValue.length > 125 ? 'text-red-500' : 'text-blue-300'
                      }`}
                    >
                      {altTextValue.length}/125
                    </span>
                  </label>
                  <input
                    className="form-input"
                    value={altTextValue}
                    onChange={(event) => {
                      setAltTextValue(event.target.value);
                      setAltTextSaved(false);
                    }}
                    onBlur={saveAltText}
                    placeholder="Describe the image for search engines and screen readers…"
                    maxLength={125}
                  />
                  <div className="flex items-center gap-2 mt-1 min-h-[16px]">
                    {altTextSaving && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-1">
                        <Icon className="fas fa-spinner fa-spin"></Icon> Saving…
                      </span>
                    )}
                    {altTextSaved && !altTextSaving && (
                      <span className="text-[10px] text-green-500 flex items-center gap-1">
                        <Icon className="fas fa-check"></Icon> Saved
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-blue-600 break-all">
                  <p><strong>URL:</strong> {detailItem.url}</p>
                  <p><strong>Type:</strong> {detailItem.mediaType}</p>
                  <p><strong>Size:</strong> {formatBytes(detailItem.size)}</p>
                  <p><strong>Uploaded:</strong> {formatDate(detailItem.uploadedAt)}</p>
                  <p><strong>Uploader:</strong> {detailItem.uploadedByName || detailItem.uploadedBy || 'Unknown'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="action-btn action-view"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(detailItem.url); pushToast('URL copied'); } catch { pushToast('Could not copy URL. Select and copy it manually.', 'error'); }
                    }}
                  >
                    <Icon className="fas fa-copy"></Icon> Copy URL
                  </button>
                  <button
                    type="button"
                    className="action-btn action-edit"
                    disabled={savingDetail}
                    onClick={() => saveRenameAndMaybeReplace(null)}
                  >
                    <Icon className={`fas ${savingDetail ? 'fa-spinner fa-spin' : 'fa-pen'}`}></Icon> Rename
                  </button>
                  <button
                    type="button"
                    className="action-btn action-view"
                    onClick={() => replaceInputRef.current?.click()}
                    disabled={savingDetail}
                  >
                    <Icon className="fas fa-sync-alt"></Icon> Replace
                  </button>
                  <input
                    ref={replaceInputRef}
                    type="file"
                    accept={ACCEPTED_FILES}
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) saveRenameAndMaybeReplace(file);
                      event.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    className="action-btn action-delete"
                    onClick={() => handleDelete(detailItem.id)}
                  >
                    <Icon className="fas fa-trash"></Icon> Delete
                  </button>
                  <a href={detailItem.url} target="_blank" rel="noreferrer" className="action-btn action-view">
                    <Icon className="fas fa-external-link-alt"></Icon> Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
