import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminShell } from '@/components/admin/admin-shell';
import './admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <AdminShell user={user}>{children}</AdminShell>;
}
