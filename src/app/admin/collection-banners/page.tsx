import { getCurrentUser } from '@/lib/auth';
import { CollectionBannersManager } from './collection-banners-manager';
import '../hero-slider/hero-slider.css';

export default async function CollectionBannersPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return <p>Admin access is required to manage collection banners.</p>;
  return <CollectionBannersManager storefrontUrl={process.env.STOREFRONT_URL ?? 'http://localhost:3000'} />;
}
