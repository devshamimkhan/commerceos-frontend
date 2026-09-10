/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaBox, FaCheck, FaSearch, FaTimes } from 'react-icons/fa';

const PAGE_SIZE = 20;

const money = (value: unknown) => `৳${Number(value || 0).toLocaleString('en-BD')}`;
const priceOf = (product: any) => product.type === 'variable'
  ? Math.min(...(product.variations?.length ? product.variations : [{ price: 0 }]).map((variation: any) => Number(variation.salePrice || variation.price || 0)))
  : Number(product.salePrice || product.regularPrice || 0);

export default function ComboProductPicker({ products, alreadySelectedIds, onConfirm, onClose, catalogs }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const availableProducts = useMemo(() => {
    const excluded = new Set((alreadySelectedIds || []).map(String));
    const categoryNames = new Map((catalogs?.categories || []).map((item: any) => [String(item._id), item.name]));
    const brandNames = new Map((catalogs?.brands || []).map((item: any) => [String(item._id), item.name]));
    const query = searchQuery.trim().toLowerCase();

    return (products || [])
      .filter((product: any) => product.type !== 'combo' && product.visibility === 'published' && !excluded.has(String(product._id)))
      .filter((product: any) => {
        if (!query) return true;
        const categories = (product.categoryIds || []).map((id: string) => categoryNames.get(String(id)) || '');
        const brand = brandNames.get(String(product.brandId || '')) || product.brand?.name || '';
        return [product.name, product.sku, product.barcode, brand, ...categories]
          .filter(Boolean).join(' ').toLowerCase().includes(query);
      });
  }, [alreadySelectedIds, catalogs, products, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(availableProducts.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageProducts = availableProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allPageChecked = pageProducts.length > 0 && pageProducts.every((product: any) => checkedIds.has(String(product._id)));
  const somePageChecked = pageProducts.some((product: any) => checkedIds.has(String(product._id)));

  const toggleProduct = (id: string) => setCheckedIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleSelectAll = () => setCheckedIds((previous) => {
    const next = new Set(previous);
    pageProducts.forEach((product: any) => {
      const id = String(product._id);
      if (allPageChecked) next.delete(id); else next.add(id);
    });
    return next;
  });

  const confirm = () => onConfirm((products || []).filter((product: any) => checkedIds.has(String(product._id))));

  return <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onMouseDown={onClose}>
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 !bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="combo-picker-title">
      <header className="flex items-center justify-between border-b border-slate-200 !bg-white px-5 py-4">
        <div>
          <h3 id="combo-picker-title" className="text-lg font-semibold text-slate-900">Select Products</h3>
          <p className="mt-0.5 text-xs text-slate-500">{availableProducts.length} available · {checkedIds.size} selected</p>
        </div>
        <button type="button" onClick={onClose} className="flex size-8 cursor-pointer items-center justify-center rounded-lg !bg-slate-100 !text-slate-500 transition-colors hover:!bg-slate-200 hover:!text-slate-800" aria-label="Close product picker"><FaTimes className="size-5" /></button>
      </header>

      <div className="border-b border-slate-200 !bg-white px-5 py-3">
        <label className="relative block">
          <FaSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
          <input type="text" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }} placeholder="Search by name, SKU, or brand..." autoFocus className="w-full rounded-xl !border !border-slate-300 !bg-white py-2 pl-9 pr-4 text-sm !text-slate-800 outline-none placeholder:!text-slate-400 focus:!border-violet-600 focus:ring-2 focus:ring-violet-500/20" />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {availableProducts.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-gray-500"><FaBox className="mb-2 size-10" /><p className="text-sm">{searchQuery ? 'No products match your search' : 'No products available'}</p></div> :
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm"><tr className="border-b border-gray-700/40">
              <th className="w-10 px-5 py-2.5 text-left"><input type="checkbox" checked={allPageChecked} ref={(element) => { if (element) element.indeterminate = somePageChecked && !allPageChecked; }} onChange={toggleSelectAll} className="size-4 cursor-pointer rounded border-gray-600 accent-rose-500 focus:ring-rose-500/50" aria-label="Select all products on this page" /></th>
              <th className="w-14 px-3 py-2.5 text-left text-[11px] font-medium text-gray-500">Image</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500">Product Name</th>
              <th className="w-24 px-3 py-2.5 text-left text-[11px] font-medium text-gray-500">SKU</th>
              <th className="w-20 px-5 py-2.5 text-right text-[11px] font-medium text-gray-500">Price</th>
            </tr></thead>
            <tbody>{pageProducts.map((product: any, index: number) => {
              const id = String(product._id);
              const checked = checkedIds.has(id);
              return <tr key={id} onClick={() => toggleProduct(id)} className={`cursor-pointer border-b border-gray-700/20 transition-colors last:border-0 ${checked ? 'bg-rose-500/10 hover:bg-rose-500/15' : index % 2 === 0 ? 'bg-gray-900/10 hover:bg-gray-800/60' : 'hover:bg-gray-800/60'}`}>
                <td className="px-5 py-2.5"><input type="checkbox" checked={checked} onChange={() => toggleProduct(id)} onClick={(event) => event.stopPropagation()} className="size-4 cursor-pointer rounded border-gray-600 accent-rose-500 focus:ring-rose-500/50" aria-label={`Select ${product.name}`} /></td>
                <td className="px-3 py-2.5">{product.mainImage ? <img src={product.mainImage} alt="" className="size-10 rounded-lg border border-gray-700 object-cover" /> : <span className="flex size-10 items-center justify-center rounded-lg bg-gray-700"><FaBox className="size-4 text-gray-500" /></span>}</td>
                <td className="px-3 py-2.5"><p className="max-w-[300px] truncate font-medium text-gray-200">{product.name}</p>{product.type && <p className="mt-0.5 text-xs capitalize text-gray-500">{product.type} product</p>}</td>
                <td className="px-3 py-2.5 text-xs text-gray-400">{product.sku || '—'}</td>
                <td className="px-5 py-2.5 text-right font-medium text-gray-300">{priceOf(product) > 0 ? money(priceOf(product)) : '—'}</td>
              </tr>;
            })}</tbody>
          </table>}
      </div>

      <footer className="flex items-center justify-between border-t border-gray-700/50 bg-gray-900/80 px-5 py-3">
        <div className="flex items-center gap-2">{totalPages > 1 && <><button type="button" onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="cursor-pointer rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-xs text-gray-500">Page {page} of {totalPages}</span><button type="button" onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="cursor-pointer rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button></>}</div>
        <div className="flex items-center gap-2"><button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-gray-600 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700">Cancel</button><button type="button" onClick={confirm} disabled={checkedIds.size === 0} className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"><FaCheck className="size-4" />Add {checkedIds.size > 0 ? `${checkedIds.size} Product${checkedIds.size > 1 ? 's' : ''}` : 'Selected'}</button></div>
      </footer>
    </div>
  </div>;
}
