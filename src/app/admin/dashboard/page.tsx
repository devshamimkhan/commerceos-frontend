import Link from 'next/link';
import { LuArrowDownRight as ArrowDownRight, LuArrowRight as ArrowRight, LuArrowUpRight as ArrowUpRight, LuCircleDollarSign as CircleDollarSign, LuPackage as Package, LuShoppingCart as ShoppingCart, LuUsers as Users } from 'react-icons/lu';
import { getDashboardServer } from '@/lib/dashboard-server';
import SalesChart from './SalesChart';

const statusClasses: Record<string, string> = {
  pending: 'status-pending', confirmed: 'status-processing', processing: 'status-processing',
  ready_for_delivery: 'status-processing', out_for_delivery: 'status-processing', delivered: 'status-delivered',
  cancelled: 'status-cancelled', returned: 'status-cancelled',
};

export default async function Dashboard() {
  const { data, error } = await getDashboardServer();
  return (
    <div className="admin-dashboard">
      <section className="dashboard-heading">
        <div><p className="admin-eyebrow">Store overview</p><p>Monitor sales, orders, customers, and inventory from one place.</p></div>
        <Link href="/admin/orders" className="admin-primary-action">Manage orders <ArrowRight /></Link>
      </section>
      {error && <p className="dashboard-empty-state" role="alert">{error}</p>}

      <section className="dashboard-stat-grid" aria-label="Store statistics">
        <StatCard label="Total Products" value={data.stats.products} icon={<Package />} trend="live inventory" isPositive />
        <StatCard label="Total Orders" value={data.stats.orders} icon={<ShoppingCart />} trend={`${Math.abs(data.trends.orders)}% monthly`} isPositive={data.trends.orders >= 0} />
        <StatCard label="Total Revenue" value={money(data.stats.revenue)} icon={<CircleDollarSign />} trend={`${Math.abs(data.trends.revenue)}% monthly`} isPositive={data.trends.revenue >= 0} />
        <StatCard label="Total Customers" value={data.stats.customers} icon={<Users />} trend={`${Math.abs(data.trends.customers)}% new`} isPositive={data.trends.customers >= 0} />
      </section>

      <section className="dashboard-primary-grid">
        <SalesChart chartdata={data.chartData} />
        <article className="dashboard-card">
          <CardHeader title="Recent Orders" href="/admin/orders" />
          <div className="dashboard-list">
            {data.recentOrders.length ? data.recentOrders.map(order => (
              <div key={order._id} className="dashboard-list-row order-row">
                <div className="dashboard-list-copy"><strong>{order.fullName}</strong><small>#{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('en-BD')}</small></div>
                <div className="order-summary"><div><strong>{money(order.totalAmount)}</strong><span className={`status-pill ${statusClasses[order.status] || 'status-neutral'}`}>{order.status.replaceAll('_', ' ')}</span></div><Link href={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`} className="admin-row-action">View</Link></div>
              </div>
            )) : <EmptyState text="No recent orders" />}
          </div>
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-card">
          <CardHeader title="Best Selling Products" href="/admin/products" />
          <div className="dashboard-list">
            {data.bestSellers.length ? data.bestSellers.map(product => (
              <div key={product._id} className="dashboard-list-row">
                <div className="dashboard-product-image">{product.image ? <span className="dashboard-product-image-fill" style={{ backgroundImage: `url(${product.image})` }} aria-hidden="true" /> : <Package />}</div>
                <div className="dashboard-list-copy"><strong>{truncate(product.name)}</strong><small>{product.totalSold} sold</small></div>
                <strong className="dashboard-price">{money(product.price)}</strong>
              </div>
            )) : <EmptyState text="No sales data yet" />}
          </div>
        </article>

        <article className="dashboard-card low-stock-card">
          <CardHeader title="Low Stock" href="/admin/products" />
          <div className="dashboard-list">
            {data.lowStock.length ? data.lowStock.map(product => (
              <div key={product._id} className="dashboard-list-row stock-row">
                <div className="dashboard-list-copy"><strong>{truncate(product.name)}</strong><small className="stock-count">{product.stockQuantity} remaining</small></div>
                <Link href={`/admin/products/edit/${product.type}/${product.productId}`} className="admin-row-action">Restock</Link>
              </div>
            )) : <EmptyState text="Inventory levels look healthy" />}
          </div>
        </article>
      </section>
    </div>
  );
}

function money(value: number) { return `৳${Number(value || 0).toLocaleString('en-US')}`; }
function truncate(value: string, maxLength = 50) { return !value ? 'Unnamed product' : value.length > maxLength ? `${value.substring(0, maxLength)}...` : value; }
function CardHeader({ title, href }: { title: string; href?: string }) { return <div className="dashboard-card-header"><h3>{title}</h3>{href && <Link href={href} aria-label={`View all ${title.toLowerCase()}`} title={`View all ${title.toLowerCase()}`}><ArrowRight /></Link>}</div>; }
function EmptyState({ text }: { text: string }) { return <p className="dashboard-empty-state">{text}</p>; }
function StatCard({ label, value, icon, trend, isPositive }: { label: string; value: string | number; icon: React.ReactNode; trend: string; isPositive: boolean }) {
  return <article className="dashboard-stat-card"><div className="dashboard-stat-topline"><span className="dashboard-stat-icon">{icon}</span><span className={`dashboard-stat-trend ${isPositive ? 'is-positive' : 'is-negative'}`}>{isPositive ? <ArrowUpRight /> : <ArrowDownRight />}{trend}</span></div><p>{label}</p><strong>{value}</strong></article>;
}
