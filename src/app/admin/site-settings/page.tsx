import { getCurrentUser } from '@/lib/auth';
import { LayoutEditor } from '../storefront-layout/layout-editor';
import '../storefront-layout/settings.css';

export default async function SiteSettingsPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return <p>Admin access is required to edit site settings.</p>;
  return <section className="storefront-settings"><header className="storefront-settings-heading"><div><h1>Site Settings</h1><p>Manage the website logo, favicon, header navigation, announcement bar and footer content from one place. Published product categories enabled for navigation continue to appear automatically.</p></div></header><LayoutEditor /></section>;
}
