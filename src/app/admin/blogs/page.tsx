/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy blog list migration; remove after API contracts are consolidated.
"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { deleteBlog, getBlogs } from "@/lib/blogs-client";

function BlogTableSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="blog-table-skeleton" aria-hidden="true">
      <td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-title" /></td>
      <td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-slug" /></td>
      <td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-status" /></td>
      <td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-date" /></td>
      <td className="px-4 py-4"><span className="blog-skeleton-block blog-skeleton-actions" /></td>
    </tr>
  ));
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const requestRef = useRef(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleting, setDeleting] = useState("");

  const loadBlogs = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    const res = await getBlogs({ page, limit: 50, search, status });
    if (requestId !== requestRef.current) return;
    if (res.success) {
      setPages(res.data.pagination.pages || 1);
      setBlogs(res.data.blogs || []);
    } else {
      toast.error(res.error || "Failed to load blogs");
    }
    setLoading(false);
  }, [search, status, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    setDeleting(id);
    const res = await deleteBlog(id);
    setDeleting("");
    if (!res.success) {
      toast.error(res.error || "Failed to delete blog");
      return;
    }

    toast.success("Blog deleted successfully");
    if (blogs.length === 1 && page > 1) setPage(page - 1);
    else await loadBlogs();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBlogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadBlogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-base font-bold text-gray-700">Manage all blog posts</p>
        </div>
        <Link
          href="/admin/blogs/create"
          className="bg-rose-gold text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
        >
          <FaPlus /> Create Blog
        </Link>
      </div>

      <div className="glassmorphism rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title or slug"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-9 py-2.5"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="glassmorphism rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700/60">
              <tr className="text-left text-sm text-gray-400">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <BlogTableSkeleton />
              ) : blogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-400" colSpan={5}>
                    No blogs found
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="border-b border-gray-800/60 last:border-b-0">
                    <td className="px-4 py-3">{blog.title}</td>
                    <td className="px-4 py-3 text-gray-400">{blog.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`blog-status-pill ${
                          blog.status === "published"
                            ? "blog-status-published"
                            : "blog-status-draft"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {blog.updatedAt ? new Date(blog.updatedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/blogs/edit/${blog._id}`}
                          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm"
                        >
                          <FaEdit /> Edit
                        </Link>
                        <button
                          type="button"
                          disabled={!!deleting}
                          onClick={() => handleDelete(blog._id)}
                          className="inline-flex items-center gap-2 bg-red-600/80 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && <div className="flex items-center justify-end gap-3"><button className="admin-row-action" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="admin-row-action" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </div>
  );
}
