import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';
import { getPublicAdminBranding } from '@/lib/admin-theme-server';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicAdminBranding();
  return { title: 'Sign in | CommerceXLab', icons: { icon: branding.adminFaviconUrl } };
}
export default function LoginPage() { return <AuthForm />; }
