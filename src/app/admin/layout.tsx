import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { AdminShell } from '@/components/admin/admin-shell';
import { BlogToaster } from '@/components/blogs/blog-toaster';
import { getAdminThemeSettings } from '@/lib/admin-theme-server';
import './admin.css';
import './compact-module-spacing.css';
import './blogs/blog.css';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getAdminThemeSettings();
  return { icons: { icon: theme.adminFaviconUrl || '/icon.png' } };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, theme] = await Promise.all([getCurrentUser(), getAdminThemeSettings()]);
  if (!user) redirect('/login');
  return <><AdminShell user={user} initialTheme={theme}>{children}</AdminShell><BlogToaster /></>;
}
