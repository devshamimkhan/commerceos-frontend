import { CatalogEditor } from '@/components/catalog/catalog-module';
import { getCatalogItemServer, getCatalogServer } from '@/lib/catalog-server';

export default async function EditCatalogPage({ params }: { params: Promise<{ catalog: string; id: string }> }) {
  const { catalog, id } = await params;
  const [item, parents] = await Promise.all([
    getCatalogItemServer(catalog, id),
    catalog === 'categories' ? getCatalogServer('categories') : Promise.resolve(null),
  ]);
  return <CatalogEditor
    kind={catalog}
    id={id}
    initialItem={item.success ? item.data : null}
    initialError={item.success ? '' : item.error}
    initialParents={parents?.success ? parents.data : []}
  />;
}
