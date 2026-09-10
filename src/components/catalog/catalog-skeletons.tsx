export function CatalogListSkeleton() {
  return (
    <div className="catalog-module blog-workspace" aria-label="Loading categories">
      <div className="flex justify-between items-center gap-4 mb-8">
        <div className="space-y-3"><span className="blog-skeleton-block h-7 w-56" /><span className="blog-skeleton-block h-4 w-80" /></div>
        <span className="blog-skeleton-block h-11 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }, (_, index) => <span key={index} className="blog-skeleton-block h-36 w-full rounded-2xl" />)}
      </div>
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6"><span className="blog-skeleton-block h-7 w-40" /><span className="blog-skeleton-block h-11 w-64 rounded-xl" /></div>
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => <span key={index} className="blog-skeleton-block h-20 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export function CatalogEditorSkeleton() {
  return (
    <div className="catalog-module blog-workspace blog-editor-page space-y-6" aria-label="Loading category editor">
      <div className="flex items-center justify-between">
        <span className="blog-skeleton-block h-8 w-52" />
        <span className="blog-skeleton-block h-11 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <section className="glassmorphism rounded-2xl p-6 space-y-5">
            <span className="blog-skeleton-block h-7 w-48" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-2"><span className="blog-skeleton-block h-4 w-32" /><span className="blog-skeleton-block h-14 w-full rounded-xl" /></div>
            ))}
            <div className="space-y-2"><span className="blog-skeleton-block h-4 w-28" /><span className="blog-skeleton-block h-36 w-full rounded-xl" /></div>
          </section>
        </div>
        <aside className="xl:col-span-4 space-y-6">
          <section className="glassmorphism rounded-2xl p-5 space-y-5">
            <span className="blog-skeleton-block h-7 w-44" />
            <span className="blog-skeleton-block h-72 w-full rounded-xl" />
          </section>
          <section className="glassmorphism rounded-2xl p-5 space-y-4">
            <span className="blog-skeleton-block h-7 w-48" />
            <span className="blog-skeleton-block h-14 w-full rounded-xl" />
            <span className="blog-skeleton-block h-14 w-full rounded-xl" />
          </section>
        </aside>
      </div>
      <section className="blog-publish-bar" aria-hidden="true">
        <div className="flex items-center gap-3"><span className="blog-skeleton-block h-11 w-11 rounded-xl" /><div className="space-y-2"><span className="blog-skeleton-block h-5 w-40" /><span className="blog-skeleton-block h-3 w-64" /></div></div>
        <div className="flex items-center gap-4"><span className="blog-skeleton-block h-10 w-36 rounded-xl" /><span className="blog-skeleton-block h-12 w-48 rounded-xl" /></div>
      </section>
    </div>
  );
}
