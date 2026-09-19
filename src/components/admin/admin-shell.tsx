"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AdminNavigation } from "./admin-navigation";
import type { AuthUser } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { LuMenu as LuMenu, LuPanelLeftClose as LuPanelLeftClose, LuPanelLeftOpen as LuPanelLeftOpen, LuX as LuX } from 'react-icons/lu';
import { ADMIN_THEME_UPDATED_EVENT, type AdminThemeSettings } from "@/lib/admin-theme";

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";

function getPageTitle(pathname: string) {
  const segment = pathname?.split("/").filter(Boolean).at(-1) || "dashboard";

  if (/^[a-f\d]{24}$/i.test(segment)) return "Details";

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function resetMobileSidebarScroll() {
  const sidebar = document.querySelector(".admin-sidebar");
  const nav = sidebar?.querySelector(".sidebar-nav");
  if (sidebar) sidebar.scrollTop = 0;
  if (nav) nav.scrollTop = 0;
}

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

export function AdminShell({ user, initialTheme, children }: { user: AuthUser; initialTheme: AdminThemeSettings; children: React.ReactNode }) {
  const fullName = user.name;
  const role = user.role;
  const userInitial = user.name.trim().charAt(0).toUpperCase() || "A";

  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const sidebarContent = <AdminNavigation logoUrl={theme.adminLogoUrl} faviconUrl={theme.adminFaviconUrl} />;
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const themeStyle = useMemo<ThemeStyle>(() => ({
    '--admin-primary': theme.primary,
    '--admin-secondary': theme.secondary,
    '--admin-accent': theme.accent,
    '--admin-page-background': theme.pageBackground,
    '--admin-surface-color': theme.surface,
    '--admin-heading-color': theme.heading,
    '--admin-text-color': theme.text,
    '--admin-muted-color': theme.muted,
    '--admin-success': theme.success,
    '--admin-warning': theme.warning,
    '--admin-danger': theme.danger,
    '--admin-info': theme.info,
    '--admin-button-primary-bg': theme.buttonPrimaryBackground,
    '--admin-button-primary-hover': theme.buttonPrimaryHover,
    '--admin-button-primary-text': theme.buttonPrimaryText,
    '--admin-button-secondary-bg': theme.buttonSecondaryBackground,
    '--admin-button-secondary-hover': theme.buttonSecondaryHover,
    '--admin-button-secondary-text': theme.buttonSecondaryText,
    '--admin-button-danger-bg': theme.buttonDangerBackground,
    '--admin-button-danger-hover': theme.buttonDangerHover,
    '--admin-button-danger-text': theme.buttonDangerText,
    '--admin-button-radius': `${theme.buttonRadius}px`,
  }), [theme]);

  useEffect(() => {
    const updateTheme = (event: Event) => setTheme((event as CustomEvent<AdminThemeSettings>).detail);
    window.addEventListener(ADMIN_THEME_UPDATED_EVENT, updateTheme);
    return () => window.removeEventListener(ADMIN_THEME_UPDATED_EVENT, updateTheme);
  }, []);

  useEffect(() => {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = theme.adminFaviconUrl || '/icon.png';
    favicon.dataset.adminFavicon = 'true';
    document.head.appendChild(favicon);
    return () => favicon.remove();
  }, [theme.adminFaviconUrl]);

  const openMobileSidebar = () => {
    resetMobileSidebarScroll();
    setIsMobileOpen(true);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMobileOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    if (isMobileOpen) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    resetMobileSidebarScroll();
    const frame = requestAnimationFrame(resetMobileSidebarScroll);
    const timer = window.setTimeout(resetMobileSidebarScroll, 280);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setIsCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"); } catch { /* Storage may be disabled. */ }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((current) => {
      const next = !current;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch { /* Keep the in-memory preference. */ }
      return next;
    });
  };

  return (
    <div
      className={`admin-container ${isCollapsed ? "sidebar-is-collapsed" : ""} ${
        isMobileOpen ? "sidebar-is-open" : ""
      }`}
      style={themeStyle}
    >
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation"
          title="Close navigation"
        >
          <LuX />
        </button>
        {sidebarContent}
        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
        </button>
      </aside>

      <button
        type="button"
        className="admin-sidebar-scrim"
        onClick={() => setIsMobileOpen(false)}
        aria-label="Close navigation overlay"
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button
              type="button"
              className="admin-icon-button admin-mobile-menu"
              onClick={openMobileSidebar}
              aria-expanded={isMobileOpen}
              aria-label="Open navigation"
              title="Open navigation"
            >
              <LuMenu />
            </button>
            <div>
              <span>CommerceXLab Admin</span>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-user-summary">
              <span className="admin-user-avatar">{userInitial}</span>
              <span className="admin-user-copy">
                <strong>{fullName}</strong>
                <small>{role}</small>
              </span>
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>

      <button
        type="button"
        className="admin-mobile-footer-menu"
        onClick={openMobileSidebar}
        aria-expanded={isMobileOpen}
        aria-label="Open navigation"
        title="Menu"
      >
        <LuMenu />
      </button>
    </div>
  );
}
