import { CatalogEditor } from '@/components/catalog/catalog-module';
import { getCatalogServer } from '@/lib/catalog-server';

export default async function CreateCatalogPage({ params }: { params: Promise<{ catalog: string }> }) {
  const { catalog } = await params;
  const parents = catalog === 'categories' ? await getCatalogServer('categories') : null;
  return <CatalogEditor kind={catalog} initialParents={parents?.success ? parents.data : []} />;
}
