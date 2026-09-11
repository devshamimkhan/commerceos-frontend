'use client';

import { usePathname } from 'next/navigation';

const Skeleton = ({ className = '' }: { className?: string }) => (
  <span className={`block animate-pulse rounded-md bg-slate-200/80 ${className}`} />
);

const FieldSkeleton = ({ area = false }: { area?: boolean }) => (
  <div className="grid gap-2">
    <Skeleton className="h-3.5 w-28" />
    <Skeleton className={`${area ? 'h-24' : 'h-12'} w-full border border-slate-200 bg-white/80`} />
  </div>
);

const MediaSkeleton = () => (
  <div className="grid min-h-52 place-items-center rounded-md border-2 border-dashed border-violet-200 bg-white/50 p-4">
    <div className="grid justify-items-center gap-3"><Skeleton className="size-10 bg-violet-200/80" /><Skeleton className="h-3.5 w-28" /><Skeleton className="h-9 w-24 bg-violet-200/80" /></div>
  </div>
);

const ToggleSkeleton = () => (
  <div className="flex min-h-[66px] items-center justify-between gap-4 rounded-md border border-slate-200 bg-white/50 px-3.5 py-3">
    <div className="grid gap-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-44 max-w-full" /></div>
    <Skeleton className="h-6 w-[42px] shrink-0 rounded-full" />
  </div>
);

const SeoSkeleton = () => (
  <section className="glassmorphism space-y-4 rounded-2xl p-6 shadow-md">
    <div className="flex items-center gap-2"><Skeleton className="size-5" /><Skeleton className="h-5 w-32" /></div>
    <FieldSkeleton />
    <FieldSkeleton area />
    <FieldSkeleton />
    <FieldSkeleton />
    <FieldSkeleton area />
  </section>
);

const PublishSkeleton = () => (
  <section className="blog-publish-bar" aria-hidden="true">
    <div className="flex items-center gap-3"><Skeleton className="size-10 bg-violet-200/80" /><div className="grid gap-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-56" /></div></div>
    <div className="flex items-center gap-3"><Skeleton className="h-10 w-28 bg-white/80" /><Skeleton className="h-10 w-40 bg-violet-200/80" /></div>
  </section>
);

export function CatalogListSkeleton() {
  return (
    <div className="catalog-module blog-workspace -mx-2 -mt-1 w-[calc(100%+16px)] max-w-none max-sm:mx-0 max-sm:mt-0 max-sm:w-full" aria-label="Loading categories" aria-busy="true">
      <div className="mb-5 flex items-center justify-between gap-5">
        <Skeleton className="h-5 w-[390px] max-w-[55%]" />
        <Skeleton className="h-10 w-48 shrink-0 bg-violet-200/80" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <section className="glassmorphism !rounded-md p-6 shadow-md" key={index}>
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-3">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="size-12 bg-violet-200/80" />
            </div>
          </section>
        ))}
      </div>

      <section className="glassmorphism !rounded-md p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-64 max-w-[45%] border border-slate-200 bg-white/80" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex h-20 items-center justify-between gap-4 rounded-md bg-slate-100/80 px-4" key={index}>
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-5 w-4 shrink-0" />
                <Skeleton className="size-5 shrink-0" />
                <Skeleton className="size-12 shrink-0" />
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-44 max-w-[35vw]" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Skeleton className="h-7 w-20 rounded-full bg-violet-200/80" />
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="size-9" />
                <Skeleton className="size-9" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-64" />
        </div>
      </section>
    </div>
  );
}

export function CatalogEditorSkeleton() {
  const pathname = usePathname();
  const isCategory = pathname.includes('/categories/');
  const isBrand = pathname.includes('/brands/');
  const isAttribute = pathname.includes('/attributes/');
  const isEditing = pathname.includes('/edit/');

  if (isBrand) {
    return (
      <div className="catalog-module blog-workspace blog-editor-page catalog-editor space-y-6" aria-label="Loading brand editor" aria-busy="true">
        <div className="flex items-center justify-between"><Skeleton className="h-7 w-36" /><Skeleton className="h-10 w-24 border border-slate-200 bg-white/80" /></div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <main className="space-y-6 xl:col-span-8">
            <section className="glassmorphism space-y-4 rounded-2xl p-6 shadow-md"><Skeleton className="h-5 w-40" /><FieldSkeleton /><FieldSkeleton /><FieldSkeleton area /><FieldSkeleton area /></section>
            <SeoSkeleton />
          </main>
          <aside className="space-y-6 xl:col-span-4">
            <section className="glassmorphism space-y-4 rounded-2xl p-5 shadow-md"><Skeleton className="h-5 w-28" /><MediaSkeleton /></section>
            <section className="glassmorphism space-y-4 rounded-2xl p-5 shadow-md"><Skeleton className="h-5 w-24" /><ToggleSkeleton /><ToggleSkeleton /></section>
          </aside>
        </div>
        <PublishSkeleton />
      </div>
    );
  }

  if (isAttribute) {
    return (
      <div className="catalog-module blog-workspace blog-editor-page catalog-editor space-y-6" aria-label="Loading attribute editor" aria-busy="true">
        <div className="flex items-center justify-between gap-4"><div className="grid gap-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-3.5 w-72" /></div><Skeleton className="h-10 w-24 border border-slate-200 bg-white/80" /></div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <main className="space-y-6 lg:col-span-2">
            <section className="glassmorphism rounded-2xl p-6 shadow-md"><div className="mb-4 flex items-center gap-2"><Skeleton className="size-5" /><Skeleton className="h-5 w-40" /></div><div className="grid gap-4"><FieldSkeleton /><FieldSkeleton /></div></section>
            <section className="glassmorphism rounded-2xl p-6 shadow-md">
              <Skeleton className="mb-4 h-5 w-20" />
              <div className="mb-4 rounded-md bg-slate-100/80 p-4"><Skeleton className="mb-3 h-3.5 w-28" /><div className="flex gap-3"><Skeleton className="h-10 flex-1 border border-slate-200 bg-white/80" /><Skeleton className="h-10 w-24 bg-violet-200/80" /></div></div>
              {isEditing ? <div className="grid gap-2">{Array.from({ length: 3 }, (_, index) => <div className="flex items-center gap-3 rounded-md bg-slate-100/80 p-3" key={index}><Skeleton className="h-3 w-5" /><Skeleton className="h-10 flex-1 bg-white/80" /><Skeleton className="size-9" /></div>)}</div> : <div className="grid min-h-32 place-items-center rounded-md border-2 border-dashed border-slate-200"><div className="grid justify-items-center gap-2"><Skeleton className="size-8" /><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-44" /></div></div>}
            </section>
          </main>
          <aside><section className="glassmorphism rounded-2xl p-6 shadow-md"><Skeleton className="mb-5 h-5 w-24" /><div className="grid gap-4">{Array.from({ length: 3 }, (_, index) => <div className="flex items-center justify-between gap-4" key={index}><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3.5 w-16" /></div>)}</div></section></aside>
        </div>
        <PublishSkeleton />
      </div>
    );
  }

  if (!isCategory) {
    return (
      <div className="catalog-module blog-workspace blog-editor-page space-y-6" aria-label="Loading catalog editor" aria-busy="true">
        <div className="flex items-center justify-between"><Skeleton className="h-7 w-48" /><Skeleton className="h-10 w-24 bg-white/80" /></div>
        <section className="glassmorphism rounded-2xl p-6 shadow-md"><div className="grid gap-4"><Skeleton className="h-5 w-40" /><FieldSkeleton /><FieldSkeleton /><FieldSkeleton area /></div></section>
        <section className="blog-publish-bar" aria-hidden="true"><div className="flex items-center gap-3"><Skeleton className="size-10" /><div className="grid gap-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-52" /></div></div><div className="flex gap-3"><Skeleton className="h-10 w-28" /><Skeleton className="h-10 w-36 bg-violet-200/80" /></div></section>
      </div>
    );
  }

  return (
    <div className="catalog-module blog-workspace blog-editor-page catalog-editor space-y-6" aria-label="Loading category editor" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-10 w-24 border border-slate-200 bg-white/80" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <main className="space-y-6 xl:col-span-8">
          <section className="glassmorphism space-y-4 rounded-2xl p-6 shadow-md">
            <Skeleton className="h-5 w-40" />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton area />
            <FieldSkeleton area />
          </section>

          <section className="glassmorphism space-y-4 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2"><Skeleton className="size-5" /><Skeleton className="h-5 w-32" /></div>
            <FieldSkeleton />
            <FieldSkeleton area />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton area />
          </section>
        </main>

        <aside className="space-y-6 xl:col-span-4">
          <section className="glassmorphism space-y-4 rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-2"><Skeleton className="size-5" /><Skeleton className="h-5 w-36" /></div>
            <MediaSkeleton />
          </section>

          <section className="glassmorphism space-y-4 rounded-2xl p-5 shadow-md">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 2 }, (_, index) => (
              <ToggleSkeleton key={index} />
            ))}
          </section>
        </aside>
      </div>

      <PublishSkeleton />
    </div>
  );
}
