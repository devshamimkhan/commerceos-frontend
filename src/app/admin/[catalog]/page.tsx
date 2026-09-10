import { CatalogList } from '@/components/catalog/catalog-module';
import { getCatalogServer } from '@/lib/catalog-server';

export default async function CatalogPage({ params }: { params: Promise<{ catalog: string }> }) {
  const { catalog } = await params;
  const result = await getCatalogServer(catalog);
  return <CatalogList kind={catalog} initialRows={result.success ? result.data : null} initialError={result.success ? '' : result.error} />;
}
