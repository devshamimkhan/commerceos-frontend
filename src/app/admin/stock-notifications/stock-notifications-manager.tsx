'use client';
/* eslint-disable @next/next/no-img-element -- Product thumbnails use administrator-managed media URLs. */
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuBellRing, LuCircleCheck, LuChevronLeft, LuChevronRight, LuClock3, LuEye, LuPackage, LuPackagePlus, LuPhone, LuSearch, LuUsers, LuX } from 'react-icons/lu';

type Group = { productId:string; productName:string; productSlug:string; productImage:string; productType:string; totalRequests:number; waiting:number; notified:number; lastRequestedAt:string };
type ListResult = { data:Group[]; stats:{ total:number; waiting:number; notified:number; products:number }; pagination:{ page:number; pages:number; total:number } };
type RequestRow = { id:string; fullName:string; phone:string; variationId:string; status:'pending'|'sending'|'sent'; attempts:number; requestedAt:string; updatedAt:string; notifiedAt:string|null; lastError:string };
type DetailResult = { data:RequestRow[]; product:{ id:string; name:string; slug:string; image:string; type:string }|null; pagination:{ page:number; pages:number; total:number } };

const endpoint='/api/v1/auth/stock-notifications';
const formatPhone=(phone:string)=>phone.startsWith('880')?`+880 ${phone.slice(3)}`:phone;
const formatDate=(value?:string|null)=>value?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
const productEditUrl=(group:Group)=>`/admin/products/edit/${['simple','variable','combo'].includes(group.productType)?group.productType:'simple'}/${group.productId}`;

export function StockNotificationsManager({storefrontUrl}:{storefrontUrl:string}) {
  const [result,setResult]=useState<ListResult|null>(null),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[status,setStatus]=useState<'all'|'pending'|'sent'>('all'),[page,setPage]=useState(1);
  const [selected,setSelected]=useState<Group|null>(null),[details,setDetails]=useState<DetailResult|null>(null),[detailLoading,setDetailLoading]=useState(false),[detailPage,setDetailPage]=useState(1);

  useEffect(()=>{const timer=setTimeout(()=>{setQuery(search);setPage(1)},350);return()=>clearTimeout(timer)},[search]);
  const load=useCallback(async()=>{setLoading(true);try{const params=new URLSearchParams({search:query,status,page:String(page),limit:'20'});const response=await fetch(`${endpoint}?${params}`,{cache:'no-store'});const json=await response.json();if(!response.ok)throw new Error(json.error?.message||'Could not load stock alerts.');setResult(json)}catch(error){toast.error(error instanceof Error?error.message:'Could not load stock alerts.')}finally{setLoading(false)}},[page,query,status]);
  useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load]);
  const loadDetails=useCallback(async(productId:string,nextPage:number)=>{setDetailLoading(true);try{const response=await fetch(`${endpoint}/products/${productId}?page=${nextPage}&limit=15`,{cache:'no-store'});const json=await response.json();if(!response.ok)throw new Error(json.error?.message||'Could not load customer requests.');setDetails(json)}catch(error){toast.error(error instanceof Error?error.message:'Could not load customer requests.')}finally{setDetailLoading(false)}},[]);
  useEffect(()=>{if(!selected)return;const timer=setTimeout(()=>void loadDetails(selected.productId,detailPage),0);return()=>clearTimeout(timer)},[detailPage,loadDetails,selected]);
  useEffect(()=>{if(!selected)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelected(null)};document.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close)}},[selected]);

  const stats=result?.stats??{total:0,waiting:0,notified:0,products:0};
  const openDetails=(group:Group)=>{setDetails(null);setDetailPage(1);setSelected(group)};

  return <main className="stock-alerts-admin">
    <header><div><h1>Stock Notifications</h1><p>See customer demand for out-of-stock products and SMS delivery progress.</p></div></header>
    <div className="stock-alert-stats">
      <article><div><span>Total Requests</span><strong>{stats.total}</strong></div><i className="total"><LuUsers/></i></article>
      <article><div><span>Waiting for Stock</span><strong>{stats.waiting}</strong></div><i className="waiting"><LuClock3/></i></article>
      <article><div><span>SMS Notified</span><strong>{stats.notified}</strong></div><i className="notified"><LuCircleCheck/></i></article>
      <article><div><span>Requested Products</span><strong>{stats.products}</strong></div><i className="products"><LuPackage/></i></article>
    </div>
    <section className="stock-alert-tools"><label><LuSearch/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search product, customer or mobile..."/></label><select value={status} onChange={event=>{setStatus(event.target.value as typeof status);setPage(1)}} aria-label="Notification status"><option value="all">All requests</option><option value="pending">Waiting for stock</option><option value="sent">SMS notified</option></select></section>
    <section className="stock-alert-table-card">
      {loading?<p className="stock-alert-empty">Loading stock requests...</p>:!result?.data.length?<p className="stock-alert-empty"><LuBellRing/>No stock notification requests found</p>:<div className="stock-alert-table-scroll"><table><thead><tr><th>Product</th><th>Waiting</th><th>Notified</th><th>Latest Request</th><th>Action</th></tr></thead><tbody>{result.data.map(group=><tr key={group.productId}><td><div className="stock-alert-product">{group.productImage?<img src={group.productImage} alt=""/>:<span><LuPackage/></span>}<div><strong>{group.productName}</strong><small>{group.productType||'Product'}</small></div></div></td><td><span className="stock-alert-metric waiting">{group.waiting}</span></td><td><span className="stock-alert-metric notified">{group.notified}</span></td><td>{formatDate(group.lastRequestedAt)}</td><td><div className="stock-alert-actions"><button className="stock-alert-view" type="button" onClick={()=>openDetails(group)}><LuEye/>View requests</button><Link className="stock-alert-restock" href={productEditUrl(group)}><LuPackagePlus/>Restock</Link></div></td></tr>)}</tbody></table></div>}
      {result&&result.pagination.pages>1&&<footer><span>Page {page} of {result.pagination.pages} · {result.pagination.total} products</span><div><button disabled={page===1} onClick={()=>setPage(value=>value-1)} aria-label="Previous page"><LuChevronLeft/></button><button disabled={page===result.pagination.pages} onClick={()=>setPage(value=>value+1)} aria-label="Next page"><LuChevronRight/></button></div></footer>}
    </section>
    {selected&&<div className="stock-alert-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null)}}><section className="stock-alert-modal" role="dialog" aria-modal="true" aria-labelledby="stock-alert-modal-title"><header><div className="stock-alert-modal-product">{selected.productImage?<img src={selected.productImage} alt=""/>:<span><LuPackage/></span>}<div><p>Customer requests</p><h2 id="stock-alert-modal-title"><a href={`${storefrontUrl.replace(/\/$/,'')}/products/${encodeURIComponent(selected.productSlug)}`} target="_blank" rel="noopener noreferrer">{selected.productName}</a></h2><small>{selected.totalRequests} total · {selected.waiting} waiting · {selected.notified} notified</small></div></div><button type="button" aria-label="Close customer requests" onClick={()=>setSelected(null)}><LuX/></button></header><div className="stock-alert-request-list">{detailLoading&&!details?<p className="stock-alert-empty">Loading customer details...</p>:!details?.data.length?<p className="stock-alert-empty">No customer requests found.</p>:details.data.map(item=><article key={item.id}><div className="stock-alert-customer"><span>{item.fullName.trim().charAt(0).toUpperCase()}</span><div><strong>{item.fullName}</strong><a href={`tel:+${item.phone}`}><LuPhone/>{formatPhone(item.phone)}</a></div></div><div className="stock-alert-request-meta">{item.variationId&&<small>Variation: <b>{item.variationId}</b></small>}<small>Requested: {formatDate(item.requestedAt)}</small>{item.notifiedAt&&<small>SMS sent: {formatDate(item.notifiedAt)}</small>}{item.lastError&&<small className="error">Last attempt: {item.lastError}</small>}</div><span className={`stock-alert-status ${item.status}`}>{item.status==='sent'?'Notified':item.status==='sending'?'Sending':'Waiting'}</span></article>)}</div>{details&&details.pagination.pages>1&&<footer><span>Page {detailPage} of {details.pagination.pages}</span><div><button disabled={detailPage===1||detailLoading} onClick={()=>setDetailPage(value=>value-1)} aria-label="Previous customer page"><LuChevronLeft/></button><button disabled={detailPage===details.pagination.pages||detailLoading} onClick={()=>setDetailPage(value=>value+1)} aria-label="Next customer page"><LuChevronRight/></button></div></footer>}</section></div>}
  </main>;
}
