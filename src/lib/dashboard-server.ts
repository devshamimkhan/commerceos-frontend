import 'server-only';
import { cookies } from 'next/headers';

export type DashboardData = {
  stats: { products: number; orders: number; revenue: number; customers: number };
  trends: { orders: number; revenue: number; customers: number };
  chartData: Array<{ name: string; sales: number }>;
  recentOrders: Array<{ _id: string; orderNumber: string; fullName: string; createdAt: string; totalAmount: number; status: string }>;
  bestSellers: Array<{ _id: string; name: string; totalSold: number; price: number; image: string; type: string }>;
  lowStock: Array<{ _id: string; productId: string; name: string; stockQuantity: number; type: string }>;
};

const emptyDashboard: DashboardData = {
  stats: { products: 0, orders: 0, revenue: 0, customers: 0 },
  trends: { orders: 0, revenue: 0, customers: 0 },
  chartData: [], recentOrders: [], bestSellers: [], lowStock: [],
};

export async function getDashboardServer(): Promise<{ data: DashboardData; error?: string }> {
  const session = (await cookies()).get('commerce.sid');
  if (!session) return { data: emptyDashboard, error: 'Authentication required.' };
  const base = (process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/auth/dashboard`, { headers: { Cookie: `commerce.sid=${session.value}` }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    const result = await response.json() as { data?: DashboardData; error?: { message?: string } };
    if (!response.ok || !result.data) return { data: emptyDashboard, error: result.error?.message || 'Could not load dashboard.' };
    return { data: result.data };
  } catch {
    return { data: emptyDashboard, error: 'Could not load dashboard.' };
  }
}
