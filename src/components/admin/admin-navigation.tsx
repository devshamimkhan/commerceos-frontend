'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LuLayoutDashboard as LayoutDashboard, LuFileText as FileText, LuPackage as Package, LuMegaphone as Megaphone, LuTruck as Truck, LuGift as Gift, LuShoppingCart as ShoppingCart, LuUsers as Users, LuImage as Image, LuStore as Store, LuSettings as Settings, LuUserRoundCog as UserRoundCog, LuShield as Shield, LuChevronRight as ChevronRight } from 'react-icons/lu';
import type { IconType as LucideIcon } from 'react-icons';
import { LogoutButton } from '@/components/auth/logout-button';

type Item = { label: string; icon: LucideIcon; href?: string; children?: [string, string][] };
const sections: { label: string; items: Item[] }[] = [
  { label: 'Main', items: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Blog', icon: FileText, children: [['All Blogs', '/admin/blogs'], ['Create Blog', '/admin/blogs/create']] },
    { label: 'Products', icon: Package, children: [['All Products', '/admin/products'], ['Categories', '/admin/categories'], ['Tags', '/admin/tags'], ['Brands', '/admin/brands'], ['Attributes', '/admin/attributes'], ['Product Q&A', '/admin/qa'], ['Product Reviews', '/admin/reviews']] },
  ] },
  { label: 'Store', items: [
    { label: 'Campaign', icon: Megaphone, href: '/admin/campaigns' },
    { label: 'Shipping Settings', icon: Truck, href: '/admin/shipping-settings' },
    { label: 'Coupons', icon: Gift, href: '/admin/coupons' },
    { label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { label: 'Customers', icon: Users, href: '/admin/customers' },
    { label: 'Media Library', icon: Image, href: '/admin/media' },
    { label: 'Store Settings', icon: Store, children: [['Delivery & Returns', '/admin/delivery-returns'], ['Trust Highlights', '/admin/trust-highlights'], ['Offer Cards', '/admin/offer-cards']] },
  ] },
  { label: 'System', items: [
    { label: 'Site Settings', icon: Settings, children: [['Payment Gateway', '/admin/payment-gateway'], ['SSLCommerz', '/admin/sslcommerz'], ['Site Settings', '/admin/settings'], ['Menu Settings', '/admin/menu-settings'], ['Contact Settings', '/admin/contact-settings'], ['Top Header', '/admin/top-header'], ['Footer', '/admin/footer'], ['Meta Pixel & CAPI', '/admin/meta-pixel'], ['Google Analytics', '/admin/google-analytics']] },
    { label: 'Staff Management', icon: UserRoundCog, href: '/admin/staff' },
    { label: 'Role Management', icon: Shield, href: '/admin/roles' },
  ] },
];

function NavigationItem({ item }: { item: Item }) {
  const pathname = usePathname();
  const childActive = item.children?.some(([, href]) => pathname === href || pathname.startsWith(href + '/')) ?? false;
  const [expanded, setExpanded] = useState(childActive);
  const Icon = item.icon;
  if (item.href) return <Link href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`} aria-current={pathname === item.href ? 'page' : undefined} title={item.label}><Icon className="sidebar-menu-icon" /><span className="sidebar-link-copy">{item.label}</span></Link>;
  const id = `nav-${item.label.toLowerCase().replaceAll(' ', '-')}`;
  return <div>
    <button type="button" className={`sidebar-parent-link ${childActive ? 'is-active' : ''}`} aria-expanded={expanded} aria-controls={id} title={item.label} onClick={() => setExpanded(!expanded)}>
      <div><Icon className="sidebar-menu-icon" /><span className="sidebar-link-copy">{item.label}</span></div><ChevronRight size={16} className="sidebar-chevron" style={{ transform: expanded ? 'rotate(90deg)' : undefined }} />
    </button>
    {expanded && <div id={id} className="child-links-container">{item.children?.map(([label, href]) => <Link className={`child-link ${pathname === href ? 'active' : ''}`} key={href} href={href}>{label}</Link>)}</div>}
  </div>;
}

export function AdminNavigation() {
  return <>
    <div className="sidebar-header"><div className="sidebar-brand-copy"><strong>CommerceOS Admin</strong><small>Store operations</small></div></div>
    <nav className="sidebar-nav">{sections.map(section => <div key={section.label}><p className="sidebar-section-label">{section.label}</p>{section.items.map(item => <NavigationItem key={item.label} item={item} />)}</div>)}</nav>
    <div className="sidebar-footer"><LogoutButton className="admin-logout-button" /></div>
  </>;
}
