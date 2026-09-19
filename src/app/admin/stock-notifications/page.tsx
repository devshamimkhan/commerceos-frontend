import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { StockNotificationsManager } from './stock-notifications-manager';
import './stock-notifications.css';

export default async function StockNotificationsPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') redirect('/admin/dashboard');
  return <StockNotificationsManager storefrontUrl={process.env.STOREFRONT_URL ?? 'http://localhost:3000'} />;
}
