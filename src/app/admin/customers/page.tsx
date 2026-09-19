import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CustomersManager } from './customers-manager';
import './customers.css';

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') redirect('/admin/dashboard');
  return <CustomersManager />;
}
