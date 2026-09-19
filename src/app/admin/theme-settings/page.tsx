import { getCurrentUser } from '@/lib/auth';
import { getAdminThemeSettings } from '@/lib/admin-theme-server';
import { ThemeSettingsEditor } from './theme-settings-editor';
import './theme-settings.css';

export default async function ThemeSettingsPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return <p>Admin access is required to edit theme settings.</p>;
  const theme = await getAdminThemeSettings();
  return <ThemeSettingsEditor initialTheme={theme} />;
}
