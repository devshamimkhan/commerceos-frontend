import { redirect } from 'next/navigation';

export default async function StorefrontLayoutPage() {
  redirect('/admin/site-settings');
}
