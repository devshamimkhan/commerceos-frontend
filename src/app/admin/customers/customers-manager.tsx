'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuChevronLeft, LuChevronRight, LuSearch, LuShieldCheck, LuStore, LuUsers, LuWarehouse } from 'react-icons/lu';

type CustomerType = 'normal' | 'wholesale';
type CustomerStatus = 'active' | 'blocked';
type Customer = { id: string; fullName: string; phone: string; customerType: CustomerType; status: CustomerStatus; phoneVerifiedAt: string | null; lastLoginAt: string | null; createdAt: string | null };
type Result = { data: Customer[]; stats: { total: number; normal: number; wholesale: number; active: number; blocked: number }; pagination: { page: number; pages: number; total: number } };
const endpoint = '/api/v1/auth/customers';
const formatPhone = (phone: string) => phone.startsWith('880') ? `+880 ${phone.slice(3)}` : phone;
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : 'Never';

export function CustomersManager() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | CustomerType>('all');
  const [status, setStatus] = useState<'all' | CustomerStatus>('all');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');

  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', type, status, search: query });
      const response = await fetch(`${endpoint}?${params}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || 'Failed to load customers.');
      setResult(json);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to load customers.'); }
    finally { setLoading(false); }
  }, [page, query, status, type]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const update = async (customer: Customer, change: Partial<Pick<Customer, 'customerType' | 'status'>>) => {
    setBusy(customer.id);
    try {
      const response = await fetch(`${endpoint}/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || 'Failed to update customer.');
      toast.success('Customer updated.');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to update customer.'); }
    finally { setBusy(''); }
  };
  const stats = result?.stats ?? { total: 0, normal: 0, wholesale: 0, active: 0, blocked: 0 };

  return <main className="customers-admin">
    <header><h1>Customers</h1><p>Manage storefront and wholesale customer accounts</p></header>
    <div className="customer-stats">
      <article><div><span>Total Customers</span><strong>{stats.total}</strong></div><i className="total"><LuUsers /></i></article>
      <article><div><span>Normal Customers</span><strong>{stats.normal}</strong></div><i className="normal"><LuStore /></i></article>
      <article><div><span>Wholesale Customers</span><strong>{stats.wholesale}</strong></div><i className="wholesale"><LuWarehouse /></i></article>
      <article><div><span>Active Customers</span><strong>{stats.active}</strong></div><i className="active"><LuShieldCheck /></i></article>
    </div>
    <section className="customer-tools">
      <label><LuSearch /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or phone..." /></label>
      <select value={type} onChange={event => { setType(event.target.value as 'all' | CustomerType); setPage(1); }} aria-label="Customer type"><option value="all">All Types</option><option value="normal">Normal</option><option value="wholesale">Wholesale</option></select>
      <select value={status} onChange={event => { setStatus(event.target.value as 'all' | CustomerStatus); setPage(1); }} aria-label="Customer status"><option value="all">All Status</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
    </section>
    <section className="customer-table-card">
      {loading ? <p className="customer-empty">Loading customers...</p> : !result?.data.length ? <p className="customer-empty"><LuUsers />No customers found</p> : <div className="customer-table-scroll"><table><thead><tr><th>Customer</th><th>Type</th><th>Status</th><th>Verified</th><th>Last Login</th></tr></thead><tbody>{result.data.map(customer => <tr key={customer.id}><td><strong>{customer.fullName}</strong><small>{formatPhone(customer.phone)}</small><small>Joined {formatDate(customer.createdAt)}</small></td><td><select disabled={busy === customer.id} value={customer.customerType} onChange={event => void update(customer, { customerType: event.target.value as CustomerType })} className={`customer-type ${customer.customerType}`}><option value="normal">Normal</option><option value="wholesale">Wholesale</option></select></td><td><select disabled={busy === customer.id} value={customer.status} onChange={event => void update(customer, { status: event.target.value as CustomerStatus })} className={`customer-status ${customer.status}`}><option value="active">Active</option><option value="blocked">Blocked</option></select></td><td>{customer.phoneVerifiedAt ? <span className="verified"><LuShieldCheck /> Phone verified</span> : 'Not verified'}</td><td>{formatDate(customer.lastLoginAt)}</td></tr>)}</tbody></table></div>}
      {result && result.pagination.pages > 1 && <footer><span>Page {page} of {result.pagination.pages} ({result.pagination.total} customers)</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><LuChevronLeft /></button><button disabled={page === result.pagination.pages} onClick={() => setPage(page + 1)} aria-label="Next page"><LuChevronRight /></button></div></footer>}
    </section>
  </main>;
}
