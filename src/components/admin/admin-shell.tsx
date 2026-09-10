"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminNavigation } from "./admin-navigation";
import type { AuthUser } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { LuMenu as LuMenu, LuPanelLeftClose as LuPanelLeftClose, LuPanelLeftOpen as LuPanelLeftOpen, LuX as LuX } from 'react-icons/lu';
import { AdminThemeToggle } from "./admin-theme-toggle";

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

export function AdminShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const fullName = user.name;
  const role = user.role;
  const userInitial = user.name.trim().charAt(0).toUpperCase() || "A";
  const sidebarContent = <AdminNavigation />;

  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

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
              <span>CommerceOS Admin</span>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <AdminThemeToggle compact />
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
