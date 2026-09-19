export interface AdminThemeSettings {
  primary: string;
  secondary: string;
  accent: string;
  pageBackground: string;
  surface: string;
  heading: string;
  text: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  buttonPrimaryBackground: string;
  buttonPrimaryHover: string;
  buttonPrimaryText: string;
  buttonSecondaryBackground: string;
  buttonSecondaryHover: string;
  buttonSecondaryText: string;
  buttonDangerBackground: string;
  buttonDangerHover: string;
  buttonDangerText: string;
  buttonRadius: number;
  adminLogoUrl: string;
  adminFaviconUrl: string;
}

export const DEFAULT_ADMIN_THEME: AdminThemeSettings = {
  primary: '#7c3aed',
  secondary: '#4338ca',
  accent: '#4f46e5',
  pageBackground: '#eeedf8',
  surface: '#ffffff',
  heading: '#1e1b4b',
  text: '#334155',
  muted: '#64748b',
  success: '#15803d',
  warning: '#a16207',
  danger: '#b91c1c',
  info: '#1d4ed8',
  buttonPrimaryBackground: '#7c3aed',
  buttonPrimaryHover: '#5b21b6',
  buttonPrimaryText: '#ffffff',
  buttonSecondaryBackground: '#ede9fe',
  buttonSecondaryHover: '#ddd6fe',
  buttonSecondaryText: '#5b21b6',
  buttonDangerBackground: '#dc2626',
  buttonDangerHover: '#b91c1c',
  buttonDangerText: '#ffffff',
  buttonRadius: 8,
  adminLogoUrl: '',
  adminFaviconUrl: '',
};

export const ADMIN_THEME_UPDATED_EVENT = 'sportsshop:admin-theme-updated';
