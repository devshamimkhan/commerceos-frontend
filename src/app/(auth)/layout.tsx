import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { getPublicAdminBranding } from '@/lib/admin-theme-server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [user, branding] = await Promise.all([getCurrentUser(), getPublicAdminBranding()]);
  if (user) redirect('/dashboard');
  return <AuthShell logoUrl={branding.adminLogoUrl}>{children}</AuthShell>;
}
