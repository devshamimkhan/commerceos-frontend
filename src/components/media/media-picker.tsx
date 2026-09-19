/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy media picker migration; remove after shared media types are consolidated.
'use client';
import Icon from '@/components/media/picker-icon';
import Image from 'next/image';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { uploadFiles, uploaderFetch, mediaApi as api } from '@/lib/media-client';
import toast from 'react-hot-toast';

const ensureHttpsMediaUrl = (value) => value;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function previewNode(item) {
  if (!item) return null;
  if (item.mediaType === 'image') {
    return <Image unoptimized width={320} height={240} src={ensureHttpsMediaUrl(item.url)} alt={item.altText || item.originalName} className="h-full w-full object-cover" />;
  }
  if (item.mediaType === 'video') {
    return (
      <video className="h-full w-full object-cover" controls preload="metadata">
        <source src={ensureHttpsMediaUrl(item.url)} type={item.mimeType} />
      </video>
    );
  }
  return (
    <div className="h-full w-full flex items-center justify-center bg-red-50 text-red-500">
      <Icon className="fas fa-file-pdf text-5xl"></Icon>
    </div>
  );
}

function mediaConfig(mediaType) {
  if (mediaType === 'csv') return { label: 'CSV', plural: 'CSV files', accept: '.csv', icon: 'fa-file-pdf' };
  if (mediaType === 'pdf') {
    return { label: 'PDF', plural: 'PDFs', accept: '.pdf', icon: 'fa-file-pdf' };
  }
  if (mediaType === 'video') {
    return { label: 'Video', plural: 'Videos', accept: '.mp4,.mov', icon: 'fa-film' };
  }
  return { label: 'Image', plural: 'Images', accept: '.jpg,.jpeg,.png,.webp', icon: 'fa-image' };
}

export default function MediaPickerModal({ open, onClose, onSelect, currentUrl = '', mediaType = 'image', multiple = false }) {
  const cfg = mediaConfig(mediaType);
  const [tab, setTab] = useState('library');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const loadRequestRef = useRef(0);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  // --- Alt text management ---
  const [altTextValue, setAltTextValue] = useState('');
  const [altTextSaving, setAltTextSaving] = useState(false);
  const [altTextSaved, setAltTextSaved] = useState(false);
  const prevSelectedIdRef = useRef(null);

  // Fetch alt text when selection changes
  useEffect(() => {
    if (!selectedItem || selectedItem.id === prevSelectedIdRef.current) return;
    prevSelectedIdRef.current = selectedItem.id;
    let cancelled = false;
    // Use the https-normalized URL so alt text keys match what parent pages
    // persist after selection (the file server returns http:// URLs).
    api.get(`/media-alt?url=${encodeURIComponent(ensureHttpsMediaUrl(selectedItem.url))}`)
      .then(({ data }) => { if (!cancelled) { setAltTextValue(data.altText || ''); setAltTextSaved(false); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedItem]);

  const savePickerAltText = useCallback(async () => {
    if (!selectedItem) return;
    setAltTextSaving(true);
    try {
      await api.put('/media-alt', {
        url: ensureHttpsMediaUrl(selectedItem.url),
        altText: altTextValue.trim(),
        mediaId: selectedItem.id,
        fileName: selectedItem.originalName,
      });
      setAltTextSaved(true);
      toast.success('Alt text saved');
      setTimeout(() => setAltTextSaved(false), 2500);
    } catch {
      toast.error('Failed to save alt text');
    } finally {
      setAltTextSaving(false);
    }
  }, [selectedItem, altTextValue]);

  async function loadMedia() {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: mediaType,
        page: '1',
        limit: '100'
      });
      if (search.trim()) params.set('search', search.trim());
      if (month) params.set('month', month);

      const res = await uploaderFetch(`/api/media?${params.toString()}`, {
        method: 'GET'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load media');

      const pageCount = Math.max(1, Number(data.pages) || 1);
      let allItems = data.items || [];

      if (pageCount > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) => {
            const pageParams = new URLSearchParams(params);
            pageParams.set('page', String(index + 2));
            return uploaderFetch(`/api/media?${pageParams.toString()}`, { method: 'GET' })
              .then(async (pageRes) => {
                const pageData = await pageRes.json().catch(() => ({}));
                if (!pageRes.ok) throw new Error(pageData.error || 'Failed to load media');
                return pageData.items || [];
              });
          })
        );
        allItems = allItems.concat(...remainingPages);
      }

      if (requestId !== loadRequestRef.current) return;
      const availableItems = allItems.filter((item) => item.available !== false);
      setItems(availableItems);
      setTotalItems(availableItems.length);
      if (currentUrl && !selectedId) {
        // Match against both the raw file-server URL and its https-normalized
        // form so a previously selected (https) image is still highlighted.
        const found = availableItems.find(
          (item) => item.url === currentUrl || ensureHttpsMediaUrl(item.url) === currentUrl
        );
        if (found) setSelectedId(found.id);
      }
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      toast.error(error.message || 'Failed to load media');
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setTab('library');
      setSelectedId(null);
      setSelectedIds([]);
      loadMedia();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mediaType]);

  useEffect(() => {
    if (!open || tab !== 'library') return;
    const t = setTimeout(() => loadMedia(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, month]);

  async function handleUploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || uploading) return;

    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      setTab('library');
      await loadMedia();
      if (uploaded.length) {
        setSelectedId(uploaded[0].id);
        if (multiple) setSelectedIds(uploaded.map((item) => item.id));
        toast.success(`${uploaded.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.querySelector('[data-blog-media-dialog]');
    const focusables = () => Array.from(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') || []);
    focusables()[0]?.focus();
    const onKey = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = focusables(); const first = items[0]; const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="blog-workspace fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
          data-blog-media-dialog role="dialog" aria-modal="true" aria-label="Media Library"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-400 flex items-center justify-center text-white shadow-lg">
                <Icon className="fas fa-images text-lg"></Icon>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Media Library</h3>
                <p className="text-sm text-gray-500">Choose or upload an image for your content</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Icon className="fas fa-times text-xl"></Icon>
            </button>
          </div>

          {/* Tabs */}
          <div className="media-picker-tabs border-b border-gray-100 px-6">
            <div className="media-picker-tab-list flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTab('library')}
                className={`media-picker-tab relative inline-flex min-h-[56px] items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${
                  tab === 'library'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="fas fa-book-open text-sm"></Icon>
                Media Library
              </button>
              <button
                type="button"
                onClick={() => setTab('upload')}
                className={`media-picker-tab relative inline-flex min-h-[56px] items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${
                  tab === 'upload'
                    ? 'border-pink-500 text-pink-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="fas fa-cloud-upload-alt text-sm"></Icon>
                Upload Files
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="media-picker-body flex-1 overflow-auto">
            {tab === 'upload' ? (
              <div className="p-6">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    accept={cfg.accept}
                    disabled={uploading}
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      handleUploadFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex min-h-[160px] flex-col items-center justify-center px-8 py-8 text-center">
                    <div
                      className={`mb-6 flex h-10 w-10 items-center justify-center transition-transform duration-200 ${
                        dragActive
                          ? 'scale-110 text-blue-600'
                          : 'text-slate-300'
                      }`}
                    >
                      <Icon className={`fas ${
                        uploading ? 'fa-spinner fa-spin' : dragActive ? 'fa-cloud-upload-alt' : 'fa-cloud-upload-alt'
                      } text-5xl`}></Icon>
                    </div>
                    <p className="mb-1 text-sm font-semibold text-slate-700">
                      {uploading ? 'Uploading...' : dragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="mb-4 text-sm text-slate-500">
                      or <span className="font-semibold text-blue-600">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Supported formats: {cfg.accept.replaceAll('.', '').toUpperCase().replaceAll(',', ', ')} (Max: 50MB each)
                    </p>
                  </div>
                </div>

                {uploading && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full animate-pulse"
                             style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="media-picker-library grid grid-cols-1 lg:grid-cols-[1fr_300px] divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                {/* Library Grid */}
                <div className="media-picker-library-main p-6">
                  {/* Filters */}
                  <div className="media-picker-search-row flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="media-picker-input-wrap relative flex-1">
                      <Icon className="fas fa-search media-picker-input-icon text-gray-400"></Icon>
                      <input
                        className="media-picker-search-input w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                        placeholder={`Search ${cfg.plural.toLowerCase()}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="media-picker-input-wrap relative w-full sm:w-40">
                      <input
                        className="media-picker-month-input w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                      />
                    </div>
                  </div>

                  {!loading && items.length > 0 && (
                    <p className="mb-3 text-xs text-gray-400">
                      Showing all {totalItems} {cfg.plural.toLowerCase()}
                    </p>
                  )}

                  {/* Grid */}
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-square rounded-xl bg-gray-100"></div>
                          <div className="h-4 bg-gray-100 rounded mt-2 w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Icon className="fas fa-images text-3xl text-gray-400"></Icon>
                      </div>
                      <p className="text-gray-600 font-medium mb-1">No {cfg.plural.toLowerCase()} found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or upload new {cfg.plural.toLowerCase()}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                      {items.map((item) => {
                        const selected = multiple ? selectedIds.includes(item.id) : item.id === selectedId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(item.id);
                              if (multiple) {
                                setSelectedIds((ids) => ids.includes(item.id)
                                  ? ids.filter((id) => id !== item.id)
                                  : [...ids, item.id]);
                              }
                            }}
                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              selected
                                ? 'border-blue-500 shadow-lg shadow-blue-100 scale-[1.02]'
                                : 'border-transparent hover:border-gray-200 hover:shadow-md'
                            }`}
                          >
                            <div className="h-full w-full transition-transform group-hover:scale-110">
                              {previewNode(item)}
                            </div>

                            {/* Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${
                              selected ? 'opacity-100' : ''
                            }`}>
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-xs text-white truncate">{item.originalName}</p>
                              </div>
                            </div>

                            {/* Selected Check */}
                            {selected && (
                              <span className="absolute top-2 right-2 h-6 w-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs shadow-lg">
                                <Icon className="fas fa-check"></Icon>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Details Panel */}
                <div className="media-picker-details p-6 bg-gray-50/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Selected {cfg.label}
                  </h4>

                  {selectedItem ? (
                    <div className="space-y-4">
                      <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        {previewNode(selectedItem)}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                            {selectedItem.originalName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(selectedItem.uploadedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{formatBytes(selectedItem.size)}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Alt Text (SEO)
                            <span
                              className={`ml-1.5 text-[10px] ${
                                altTextValue.length > 125 ? 'text-red-500' : 'text-gray-300'
                              }`}
                            >
                              {altTextValue.length}/125
                            </span>
                          </label>
                          <input
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                            value={altTextValue}
                            onChange={(e) => {
                              setAltTextValue(e.target.value);
                              setAltTextSaved(false);
                            }}
                            onBlur={savePickerAltText}
                            placeholder="Describe the image…"
                            maxLength={125}
                          />
                          <div className="flex items-center gap-2 mt-1 min-h-[14px]">
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

                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-400 mb-1">URL</p>
                          <p className="text-xs text-gray-600 break-all">{selectedItem.url}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Icon className="fas fa-image text-2xl text-gray-300"></Icon>
                      </div>
                      <p className="text-sm text-gray-500">No {cfg.label.toLowerCase()} selected</p>
                      <p className="text-xs text-gray-400 mt-1">Click on a {cfg.label.toLowerCase()} to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="media-picker-footer px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                (multiple ? selectedItems.length > 0 : selectedItem)
                  ? 'bg-gradient-to-r from-pink-600 to-pink-400 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={multiple ? selectedItems.length === 0 : !selectedItem}
              onClick={() => {
                if (multiple) {
                  if (!selectedItems.length) return;
                  onSelect(selectedItems.map((item) => ({ ...item, url: ensureHttpsMediaUrl(item.url) })));
                  onClose();
                  return;
                }
                if (!selectedItem) return;
                // The file server returns http:// URLs, but next/image only
                // allows https:// for this host (see next.config images).
                // Normalize before handing the item to the parent so previews
                // don't crash with an "Invalid src prop" error.
                onSelect({ ...selectedItem, url: ensureHttpsMediaUrl(selectedItem.url) });
                onClose();
              }}
            >
              <Icon className="fas fa-check-circle"></Icon>
              {multiple ? `Add ${selectedItems.length} ${selectedItems.length === 1 ? cfg.label : cfg.plural}` : `Add ${cfg.label}`}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
