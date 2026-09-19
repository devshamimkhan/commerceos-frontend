import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { OrdersManager } from './orders-manager';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') redirect('/admin/dashboard');
  return <OrdersManager />;
}
