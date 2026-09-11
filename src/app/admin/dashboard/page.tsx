import Link from "next/link";
import { LuArrowDownRight as ArrowDownRight, LuArrowRight as ArrowRight, LuArrowUpRight as ArrowUpRight, LuCircleDollarSign as CircleDollarSign, LuPackage as Package, LuShoppingCart as ShoppingCart, LuUsers as Users } from 'react-icons/lu';
import SalesChart from "./SalesChart";
// Reference fixtures until the commerce reporting API is implemented.
const data = {
  stats: { products: 222, orders: 3, revenue: 2080, customers: 0 },
  trends: { orders: 100, revenue: 100, customers: 0 },
  chartData: [{ name: "Sep", sales: 2080 }],
  recentOrders: [
    { _id: "preview-1", fullName: "Shamim Khan", createdAt: "2026-09-08", totalAmount: 570, status: "Pending" },
    { _id: "preview-2", fullName: "Shamim Khan", createdAt: "2026-09-08", totalAmount: 740, status: "Processing" },
    { _id: "preview-3", fullName: "Rock Roy", createdAt: "2026-09-07", totalAmount: 770, status: "Delivered" },
  ],
  bestSellers: [
    { _id: "preview-1", name: "Classic Runner", totalSold: 18, price: 4850, image: "" },
    { _id: "preview-2", name: "Essential Tee", totalSold: 13, price: 950, image: "" },
    { _id: "preview-3", name: "Steel Bottle", totalSold: 9, price: 620, image: "" },
  ],
  lowStock: [
    { _id: "preview-1", name: "Classic Runner · Black / 42", stockQuantity: 2, type: "simple" },
    { _id: "preview-2", name: "Essential Tee · Navy / M", stockQuantity: 4, type: "simple" },
    { _id: "preview-3", name: "Steel Bottle · 750ml", stockQuantity: 6, type: "simple" },
  ],
};

const statusClasses: Record<string, string> = {
  Pending: "status-pending",
  Processing: "status-processing",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
};

export default function Dashboard() {
  const chartdata = data.chartData;

  return (
    <div className="admin-dashboard">
      <section className="dashboard-heading">
        <div>
          <p className="admin-eyebrow">Store overview</p>
          <p>Monitor sales, orders, customers, and inventory from one place.</p>
        </div>
        <Link href="/admin/orders" className="admin-primary-action">
          Manage orders <ArrowRight />
        </Link>
      </section>

      <section className="dashboard-stat-grid" aria-label="Store statistics">
        <StatCard
          label="Total Products"
          value={data.stats.products}
          icon={<Package />}
          trend={`${data.stats.products} real time`}
          isPositive={data.stats.products >= 0}
        />
        <StatCard
          label="Total Orders"
          value={data.stats.orders}
          icon={<ShoppingCart />}
          trend={`${data.trends.orders}% growth`}
          isPositive={data.trends.orders >= 0}
        />
        <StatCard
          label="Total Revenue"
          value={`৳${data.stats.revenue.toLocaleString()}`}
          icon={<CircleDollarSign />}
          trend={`${data.trends.revenue}% monthly`}
          isPositive={data.trends.revenue >= 0}
        />
        <StatCard
          label="Total Customers"
          value={data.stats.customers}
          icon={<Users />}
          trend={`${data.trends.customers}% new`}
          isPositive={data.trends.customers >= 0}
        />
      </section>

      <section className="dashboard-primary-grid">
        <SalesChart chartdata={chartdata} />

        <article className="dashboard-card">
          <CardHeader title="Recent Orders" href="/admin/orders" />
          <div className="dashboard-list">
            {data?.recentOrders?.length ? (
              data.recentOrders.map((order) => (
                <div key={order._id} className="dashboard-list-row order-row">
                  <div className="dashboard-list-copy">
                    <strong>{order.fullName}</strong>
                    <small>{new Date(order.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div className="order-summary">
                    <div>
                      <strong>৳{order.totalAmount}</strong>
                      <span className={`status-pill ${statusClasses[order.status] || "status-neutral"}`}>
                        {order.status}
                      </span>
                    </div>
                    <Link href={`/admin/orders/${order._id}`} className="admin-row-action">
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No recent orders" />
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-card">
          <CardHeader title="Best Selling Products" />
          <div className="dashboard-list">
            {data?.bestSellers?.length ? (
              data.bestSellers.map((product) => (
                <div key={product._id} className="dashboard-list-row">
                  <div className="dashboard-product-image">
                    {product.image ? (
                      <span
                        className="dashboard-product-image-fill"
                        style={{ backgroundImage: `url(${product.image})` }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Package />
                    )}
                  </div>
                  <div className="dashboard-list-copy">
                    <strong>{truncate(product.name)}</strong>
                    <small>{product.totalSold} sold</small>
                  </div>
                  <strong className="dashboard-price">৳{product.price}</strong>
                </div>
              ))
            ) : (
              <EmptyState text="No sales data yet" />
            )}
          </div>
        </article>

        <article className="dashboard-card low-stock-card">
          <CardHeader title="Low Stock" />
          <div className="dashboard-list">
            {data?.lowStock?.length ? (
              data.lowStock.map((product) => (
                <div key={product._id} className="dashboard-list-row stock-row">
                  <div className="dashboard-list-copy">
                    <strong>{truncate(product.name)}</strong>
                    <small className="stock-count">{product.stockQuantity} remaining</small>
                  </div>
                  <Link
                    href={`/admin/products/edit/${product.type}/${product._id}`}
                    className="admin-row-action"
                  >
                    Restock
                  </Link>
                </div>
              ))
            ) : (
              <EmptyState text="Inventory levels look healthy" />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function truncate(value: string, maxLength = 50) {
  if (!value) return "Unnamed product";
  return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
}

function CardHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="dashboard-card-header">
      <h3>{title}</h3>
      {href && (
        <Link href={href} aria-label={`View all ${title.toLowerCase()}`} title={`View all ${title.toLowerCase()}`}>
          <ArrowRight />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="dashboard-empty-state">{text}</p>;
}

function StatCard({ label, value, icon, trend, isPositive }: { label: string; value: string | number; icon: React.ReactNode; trend: string; isPositive: boolean }) {
  return (
    <article className="dashboard-stat-card">
      <div className="dashboard-stat-topline">
        <span className="dashboard-stat-icon">{icon}</span>
        <span className={`dashboard-stat-trend ${isPositive ? "is-positive" : "is-negative"}`}>
          {isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
          {trend}
        </span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
