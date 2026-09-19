'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuLayoutDashboard as LayoutDashboard, LuFileText as FileText, LuPackage as Package, LuMegaphone as Megaphone, LuTruck as Truck, LuGift as Gift, LuShoppingCart as ShoppingCart, LuUsers as Users, LuImage as ImageIcon, LuStore as Store, LuSettings as Settings, LuUserRoundCog as UserRoundCog, LuShield as Shield, LuChevronRight as ChevronRight, LuBellRing as BellRing, LuPalette as Palette } from 'react-icons/lu';
import type { IconType as LucideIcon } from 'react-icons';
import { LogoutButton } from '@/components/auth/logout-button';
import { PENDING_ORDER_COUNT_EVENT, PENDING_REVIEW_COUNT_EVENT } from '@/lib/admin-events';

type Item = { label: string; icon: LucideIcon; href?: string; children?: [string, string][] };
const sections: { label: string; items: Item[] }[] = [
  { label: 'Main', items: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Blog', icon: FileText, children: [['All Blogs', '/admin/blogs'], ['Create Blog', '/admin/blogs/create']] },
    { label: 'Products', icon: Package, children: [['All Products', '/admin/products'], ['Categories', '/admin/categories'], ['Tags', '/admin/tags'], ['Brands', '/admin/brands'], ['Attributes', '/admin/attributes'], ['Product Reviews', '/admin/reviews']] },
  ] },
  { label: 'Store', items: [
    { label: 'Campaign', icon: Megaphone, href: '/admin/campaigns' },
    { label: 'Shipping Settings', icon: Truck, href: '/admin/shipping-settings' },
    { label: 'Coupons', icon: Gift, href: '/admin/coupons' },
    { label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { label: 'Stock Notifications', icon: BellRing, href: '/admin/stock-notifications' },
    { label: 'Customers', icon: Users, href: '/admin/customers' },
    { label: 'Media Library', icon: ImageIcon, href: '/admin/media' },
    { label: 'Home Settings', icon: Store, children: [['Hero Slider', '/admin/hero-slider'], ['Collection Banners', '/admin/collection-banners']] },
    { label: 'Site Settings', icon: Settings, href: '/admin/site-settings' },
    { label: 'Store Settings', icon: Store, children: [['Delivery & Returns', '/admin/delivery-returns'], ['Trust Highlights', '/admin/trust-highlights'], ['Offer Cards', '/admin/offer-cards']] },
  ] },
  { label: 'System', items: [
    { label: 'Theme Settings', icon: Palette, href: '/admin/theme-settings' },
    { label: 'Integrations', icon: Settings, children: [['Payment Gateway', '/admin/payment-gateway'], ['SSLCommerz', '/admin/sslcommerz'], ['Meta Pixel & CAPI', '/admin/meta-pixel'], ['Google Analytics', '/admin/google-analytics']] },
    { label: 'Staff Management', icon: UserRoundCog, href: '/admin/staff' },
    { label: 'Role Management', icon: Shield, href: '/admin/roles' },
  ] },
];

function NavigationItem({ item, pendingOrderCount, pendingReviewCount }: { item: Item; pendingOrderCount: number; pendingReviewCount: number }) {
  const pathname = usePathname();
  const childActive = item.children?.some(([, href]) => pathname === href || pathname.startsWith(href + '/')) ?? false;
  const [expanded, setExpanded] = useState(childActive);
  const Icon = item.icon;
  if (item.href) return <Link href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`} aria-current={pathname === item.href ? 'page' : undefined} title={item.label}><Icon className="sidebar-menu-icon" /><span className="sidebar-link-copy">{item.label}</span>{item.href === '/admin/orders' && pendingOrderCount > 0 && <span className="sidebar-count-badge" aria-label={`${pendingOrderCount} pending orders`}>{pendingOrderCount > 99 ? '99+' : pendingOrderCount}</span>}</Link>;
  const id = `nav-${item.label.toLowerCase().replaceAll(' ', '-')}`;
  return <div>
    <button type="button" className={`sidebar-parent-link ${childActive ? 'is-active' : ''}`} aria-expanded={expanded} aria-controls={id} title={item.label} onClick={() => setExpanded(!expanded)}>
      <div><Icon className="sidebar-menu-icon" /><span className="sidebar-link-copy">{item.label}</span></div><ChevronRight size={16} className="sidebar-chevron" style={{ transform: expanded ? 'rotate(90deg)' : undefined }} />
    </button>
    {expanded && <div id={id} className="child-links-container">{item.children?.map(([label, href]) => <Link className={`child-link ${pathname === href ? 'active' : ''}`} key={href} href={href}><span>{label}</span>{href === '/admin/reviews' && pendingReviewCount > 0 && <span className="sidebar-count-badge" aria-label={`${pendingReviewCount} pending reviews`}>{pendingReviewCount > 99 ? '99+' : pendingReviewCount}</span>}</Link>)}</div>}
  </div>;
}

export function AdminNavigation({ logoUrl = '', faviconUrl = '' }: { logoUrl?: string; faviconUrl?: string }) {
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  useEffect(() => {
    let active = true;
    const loadPendingCounts = async () => {
      try {
        const [reviewResponse,orderResponse] = await Promise.all([
          fetch('/api/v1/auth/reviews?page=1&limit=1&status=pending', { cache: 'no-store' }),
          fetch('/api/v1/auth/orders?page=1&limit=1&status=pending', { cache: 'no-store' }),
        ]);
        if (!active) return;
        if (reviewResponse.ok) { const result = await reviewResponse.json() as { stats?: { pending?: number } }; setPendingReviewCount(Math.max(0, result.stats?.pending ?? 0)); }
        if (orderResponse.ok) { const result = await orderResponse.json() as { stats?: { pending?: number } }; setPendingOrderCount(Math.max(0, result.stats?.pending ?? 0)); }
      } catch {
        // Keep navigation usable when the backend is temporarily unavailable.
      }
    };
    const handleCountUpdate = (event: Event) => {
      const count = (event as CustomEvent<number>).detail;
      if (Number.isFinite(count)) setPendingReviewCount(Math.max(0, count));
    };
    const handleOrderCountUpdate = (event: Event) => {
      const count = (event as CustomEvent<number>).detail;
      if (Number.isFinite(count)) setPendingOrderCount(Math.max(0, count));
    };
    const handleFocus = () => void loadPendingCounts();
    void loadPendingCounts();
    window.addEventListener(PENDING_REVIEW_COUNT_EVENT, handleCountUpdate);
    window.addEventListener(PENDING_ORDER_COUNT_EVENT, handleOrderCountUpdate);
    window.addEventListener('focus', handleFocus);
    const interval = window.setInterval(loadPendingCounts, 60_000);
    return () => {
      active = false;
      window.removeEventListener(PENDING_REVIEW_COUNT_EVENT, handleCountUpdate);
      window.removeEventListener(PENDING_ORDER_COUNT_EVENT, handleOrderCountUpdate);
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(interval);
    };
  }, []);

  return <>
    <div className="sidebar-header has-brand-logo">
      <Link href="/admin/dashboard" className="sidebar-brand-link has-brand-logo" aria-label="SportsShop dashboard">
        <NextImage unoptimized src={logoUrl || "/branding/sportsshop-logo.webp"} alt="SportsShop" width={720} height={310} className="sidebar-brand-logo sidebar-brand-logo-wide" priority />
        <NextImage unoptimized src={faviconUrl || "/branding/sportsshop-icon.webp"} alt="" width={1254} height={1254} className="sidebar-brand-logo sidebar-brand-logo-icon" aria-hidden="true" />
      </Link>
    </div>
    <nav className="sidebar-nav">{sections.map(section => <div key={section.label}><p className="sidebar-section-label">{section.label}</p>{section.items.map(item => <NavigationItem key={item.label} item={item} pendingOrderCount={pendingOrderCount} pendingReviewCount={pendingReviewCount} />)}</div>)}</nav>
    <div className="sidebar-footer"><LogoutButton className="admin-logout-button" /></div>
  </>;
}
