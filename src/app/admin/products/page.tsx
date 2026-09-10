import { ProductList } from '@/components/products/product-module';
import { getProductsServer } from '@/lib/product-server';
import { getCatalogServer } from '@/lib/catalog-server';

export default async function ProductsPage() {
  const [result, categories, brands] = await Promise.all([getProductsServer(), getCatalogServer('categories'), getCatalogServer('brands')]);
  return <ProductList catalogs={{ categories: categories.success ? categories.data : [], brands: brands.success ? brands.data : [] }} initial={result.success ? result : { success: true, data: [], stats: { total: 0, simple: 0, variable: 0, combo: 0 }, pagination: { page: 1, pages: 1, total: 0 }, error: result.error }} />;
}
