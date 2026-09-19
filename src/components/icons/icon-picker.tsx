'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconType } from 'react-icons';
import './icon-picker.css';
export type IconChoice = { library: 'fa6' | 'lu'; name: string };
type Pack = Record<string, IconType>;
const packs: Partial<Record<IconChoice['library'], Promise<Pack>>> = {};
function load(library: IconChoice['library']) { return packs[library] ??= (library === 'fa6' ? import('react-icons/fa6') : import('react-icons/lu')).then(module => Object.fromEntries(Object.entries(module).filter(([name, icon]) => name !== 'default' && typeof icon === 'function')) as Pack); }
export function IconPreview({ icon }: { icon: IconChoice | null }) {
 const [pack, setPack] = useState<Pack>({});
 const library = icon?.library;
 useEffect(() => { let current = true; if (library) void load(library).then(p => { if(current) setPack(p); }).catch(() => {}); return () => { current = false; }; }, [library]);
 const Component = icon ? pack[icon.name] : null;
 return Component ? <Component aria-hidden size="1em" /> : <span aria-hidden>◇</span>;
}
export function IconPicker({ value, onSelect, onClose }: { value: IconChoice | null; onSelect: (icon: IconChoice) => void; onClose: () => void }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [library, setLibrary] = useState<IconChoice['library']>(value?.library ?? 'fa6');
 const [pack, setPack] = useState<Pack>({});
 const [query, setQuery] = useState(''); const [limit, setLimit] = useState(120); const [error,setError] = useState('');
 useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
 useEffect(() => { let current=true; void load(library).then(p => { if(current) setPack(p); }).catch(() => { if(current) setError('Icons could not load. Close and reopen the picker.'); }); return () => {current=false}; }, [library]);
 const names = Object.keys(pack).filter(name => name.startsWith(library === 'fa6' ? 'Fa' : 'Lu') && name.toLowerCase().includes(query.toLowerCase().replace(/\s/g,'')));
 return createPortal(<dialog ref={dialog} className="icon-picker" aria-labelledby="icon-picker-title" onCancel={onClose}>
 <header><h2 id="icon-picker-title">Choose an icon</h2><button type="button" onClick={onClose} aria-label="Close icon picker">×</button></header>
 <input autoFocus aria-label="Search icons" placeholder="Search icons..." value={query} onChange={e => {setQuery(e.target.value);setLimit(120)}} />
 <div className="icon-picker-tabs">{(['fa6','lu'] as const).map(lib => <button type="button" key={lib} aria-pressed={library===lib} onClick={() => {setLibrary(lib);setLimit(120)}}>{lib==='fa6'?'Font Awesome 6':'Lucide'}</button>)}</div>
 <p role="status">{error || names.length + ' icons'}</p><div className="icon-picker-grid">{names.slice(0,limit).map(name => {const Icon=pack[name];return <button type="button" key={name} title={name} aria-label={name} aria-pressed={value?.library===library && value.name===name} onClick={() => {onSelect({library,name});onClose()}}><Icon /></button>})}</div>
 {names.length===0 && !error && <p>No matching icons.</p>}{names.length>limit && <button className="icon-picker-more" type="button" onClick={() => setLimit(limit+120)}>Load more icons</button>}
 </dialog>, document.body);
}
