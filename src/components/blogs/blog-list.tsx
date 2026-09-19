/* eslint-disable @next/next/no-img-element -- Blog thumbnails can come from the shared media service or external URLs. */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy blog list migration; remove after response contracts are consolidated.
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaEdit, FaImage, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { deleteBlog, getBlogs } from '@/lib/blogs-client';
import { rememberBlogList } from '@/lib/blog-navigation';

const formatBlogDateTime = (value) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '-';
  const dhaka = new Date(timestamp + 6 * 60 * 60 * 1000);
  const part = (number) => String(number).padStart(2, '0');
  return `${part(dhaka.getUTCDate())}/${part(dhaka.getUTCMonth() + 1)}/${dhaka.getUTCFullYear()}, ${part(dhaka.getUTCHours())}:${part(dhaka.getUTCMinutes())}:${part(dhaka.getUTCSeconds())}`;
};

function BlogTableSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="blog-table-skeleton" aria-hidden="true">
      <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="blog-skeleton-block size-12 shrink-0 rounded-[9px]" /><span className="blog-skeleton-block blog-skeleton-title" /></div></td><td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-slug" /></td><td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-status" /></td><td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-date" /></td><td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-actions" /></td>
    </tr>
  ));
}

export default function BlogList({ initial }) {
  const initialData = initial?.success ? initial.data : null;
  const [blogs, setBlogs] = useState(initialData?.blogs || []);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const requestRef = useRef(0);
  const skipInitialFetch = useRef(Boolean(initialData));
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(initialData?.pagination?.pages || 1);
  const [deleting, setDeleting] = useState('');

  const loadBlogs = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    const result = await getBlogs({ page, limit: 50, search, status });
    if (requestId !== requestRef.current) return;
    if (result.success) { setPages(result.data.pagination.pages || 1); setBlogs(result.data.blogs || []); }
    else toast.error(result.error || 'Failed to load blogs');
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    if (skipInitialFetch.current) { skipInitialFetch.current = false; return; }
    const timer = setTimeout(loadBlogs, 300);
    return () => clearTimeout(timer);
  }, [loadBlogs]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    setDeleting(id);
    const result = await deleteBlog(id);
    setDeleting('');
    if (!result.success) return toast.error(result.error || 'Failed to delete blog');
    toast.success('Blog deleted successfully');
    if (blogs.length === 1 && page > 1) setPage(page - 1); else await loadBlogs();
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><p className="text-base font-bold text-gray-700">Manage all blog posts</p><Link href="/admin/blogs/create" onClick={rememberBlogList} className="bg-rose-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white"><FaPlus /> Create Blog</Link></div>
    <div className="glassmorphism grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-3"><div className="relative md:col-span-2"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title or slug" className="w-full rounded-xl border border-gray-700 bg-gray-800 px-9 py-2.5" /></div><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5"><option value="">All Status</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
    <div className="glassmorphism overflow-hidden rounded-2xl"><div className="overflow-x-auto"><table className="w-full"><thead className="border-b border-gray-700/60"><tr className="text-left text-sm text-gray-400"><th className="px-4 py-3">Title</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{loading ? <BlogTableSkeleton /> : blogs.length === 0 ? <tr><td className="px-4 py-6 text-gray-400" colSpan={5}>No blogs found</td></tr> : blogs.map((blog) => <tr key={blog._id} className="border-b border-gray-800/60 last:border-b-0"><td className="px-4 py-3"><div className="flex min-w-0 items-center gap-3">{blog.featuredImage ? <img className="size-12 shrink-0 rounded-[9px] object-cover" src={blog.featuredImage} alt="" /> : <span className="grid size-12 shrink-0 place-items-center rounded-[9px] bg-pink-200 text-pink-700"><FaImage /></span>}<strong className="block min-w-0 truncate font-medium" title={blog.title}>{blog.title}</strong></div></td><td className="px-4 py-3 text-gray-400">{blog.slug}</td><td className="px-4 py-3"><span className={`blog-status-pill ${blog.status === 'published' ? 'blog-status-published' : 'blog-status-draft'}`}>{blog.status}</span></td><td className="px-4 py-3 text-sm text-gray-400">{blog.updatedAt ? formatBlogDateTime(blog.updatedAt) : '-'}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><Link href={`/admin/blogs/edit/${blog._id}`} onClick={rememberBlogList} className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700"><FaEdit /> Edit</Link><button type="button" disabled={Boolean(deleting)} onClick={() => handleDelete(blog._id)} className="inline-flex items-center gap-2 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm hover:bg-red-600"><FaTrash /> Delete</button></div></td></tr>)}</tbody></table></div></div>
    {pages > 1 && <div className="flex items-center justify-end gap-3"><button className="admin-row-action" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="admin-row-action" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>}
  </div>;
}
