'use client';

import { usePathname } from 'next/navigation';

type ProductType = 'simple' | 'variable' | 'combo';

const Line = ({ className = '' }: { className?: string }) => <span className={`block rounded-md bg-slate-200/80 ${className}`} />;
const Input = () => <div className="grid gap-2"><Line className="h-3 w-28"/><Line className="h-11 w-full border border-slate-200 bg-white/80"/></div>;
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <section className={`product-form-card !rounded-md ${className}`}>{children}</section>;
const CardTitle = ({ width = 'w-44' }: { width?: string }) => <div className="mb-5 flex items-center gap-2.5"><Line className="size-5"/><Line className={`h-5 ${width}`}/></div>;

function PricingSkeleton() {
  return <Card><CardTitle width="w-40"/><div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">{Array.from({length:8},(_,index)=><Input key={index}/>)}</div></Card>;
}

function VariableSkeleton() {
  return <><div className="grid h-[62px] grid-cols-2 overflow-hidden rounded-md border border-[var(--admin-border)] bg-white"><div className="flex items-center justify-center gap-3 bg-violet-100/70"><Line className="size-7 rounded-full"/><div className="grid gap-1"><Line className="h-3 w-20"/><Line className="h-2 w-16"/></div></div><div className="flex items-center justify-center gap-3"><Line className="size-7 rounded-full"/><div className="grid gap-1"><Line className="h-3 w-20"/><Line className="h-2 w-16"/></div></div></div><Card><CardTitle width="w-52"/><div className="grid gap-4"><Input/><Line className="h-12 w-full border border-dashed border-violet-200 bg-white/70"/><Line className="h-32 w-full bg-white/70"/></div></Card></>;
}

function ComboSkeleton() {
  return <Card><CardTitle width="w-44"/><div className="grid gap-3"><Line className="h-16 w-full border border-slate-200 bg-white/80"/><Line className="h-16 w-full border border-slate-200 bg-white/80"/><Line className="h-20 w-full border border-dashed border-violet-200 bg-white/70"/><div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">{Array.from({length:8},(_,index)=><Input key={index}/>)}</div></div></Card>;
}

function AsideSkeleton() {
  return <aside><Card><CardTitle width="w-36"/><Line className="h-56 w-full border-2 border-dashed border-slate-200 bg-white/60"/><Line className="mt-4 h-32 w-full border-2 border-dashed border-violet-200 bg-white/60"/></Card><Card><CardTitle width="w-32"/><div className="grid gap-4"><Input/><Line className="h-52 w-full bg-white/70"/><Input/><Input/></div></Card><Card><CardTitle width="w-36"/><div className="grid gap-4">{Array.from({length:3},(_,index)=><div className="flex min-h-[66px] items-center justify-between rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-bg)] px-3.5 py-3" key={index}><div className="grid gap-2"><Line className="h-3.5 w-32"/><Line className="h-2.5 w-40 max-w-full"/></div><Line className="h-6 w-[42px] rounded-full"/></div>)}</div></Card></aside>;
}

export default function ProductEditorSkeleton({ type }: { type?: ProductType }) {
  const pathname = usePathname();
  const resolvedType: ProductType = type || (pathname.includes('/variable/') ? 'variable' : pathname.includes('/combo/') ? 'combo' : 'simple');
  return <div className="product-editor blog-workspace blog-editor-page animate-pulse [&_.product-form-card]:!rounded-md" aria-busy="true" aria-label="Loading product editor">
    <div className="product-editor-heading"><Line className="h-4 w-56"/><Line className="h-10 w-20 bg-white/80"/></div>
    <div className="product-editor-layout"><main><Card><CardTitle width="w-36"/><div className="grid gap-4"><Input/><Input/></div></Card>{resolvedType==='simple'?<PricingSkeleton/>:resolvedType==='variable'?<VariableSkeleton/>:<ComboSkeleton/>}<Card><CardTitle width="w-36"/><Line className="mb-4 h-28 w-full bg-white/70"/><Line className="h-44 w-full bg-white/70"/></Card><Card><CardTitle width="w-28"/><div className="grid gap-4"><Input/><Line className="h-32 w-full bg-white/70"/><Input/></div></Card></main><AsideSkeleton/></div>
    <section className="blog-publish-bar" aria-hidden="true"><div className="blog-publish-bar-copy"><Line className="size-10"/><div className="grid gap-2"><Line className="h-4 w-32"/><Line className="h-2.5 w-52"/></div></div><div className="blog-publish-bar-actions"><Line className="h-10 w-28"/><Line className="h-11 w-36 bg-violet-200"/></div></section>
  </div>;
}
