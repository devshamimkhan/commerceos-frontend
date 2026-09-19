/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy product module migration; remove after API models are consolidated.
"use client";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaExclamationTriangle,
  FaGlobe,
  FaGripVertical,
  FaImage,
  FaList,
  FaPlus,
  FaRegStar,
  FaSave,
  FaSearch,
  FaSpinner,
  FaStar,
  FaSync,
  FaTags,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  bulkDeleteCatalogItems,
  createCatalogItem,
  deleteCatalogItem,
  getCatalog,
  getCatalogItem,
  updateCatalogItem,
} from "@/lib/catalog-client";
import MediaPickerModal from "@/components/media/media-picker";
import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
const catalogReturnKey = (kind) => `${kind}-list-return`;
const rememberCatalogList = (kind) => {
  try { sessionStorage.setItem(catalogReturnKey(kind), "true"); } catch { /* Navigation still works without storage. */ }
};
const labels = {
  categories: ["Category", "Categories"],
  tags: ["Tag", "Tags"],
  brands: ["Brand", "Brands"],
  attributes: ["Attribute", "Attributes"],
};
const info = (k) => labels[k] || labels.categories;
const createSlug = (value) =>
  value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
const blank = {
  name: "",
  slug: "",
  description: "",
  bottomContent: "",
  seoTitle: "",
  seoDescription: "",
  schemaMarkup: "",
  canonicalUrl: "",
  focusKeywords: "",
  parentId: "",
  menu: "",
  icon: "",
  image: "",
  imageAltText: "",
  imageCaption: "",
  status: "published",
  isFeatured: false,
  showInNavigation: true,
  order: 0,
  type: "standard",
  isActive: true,
  showInFilters: true,
  color: "#7c3aed",
  title: "",
  showOnHomepage: false,
  logo: "",
  terms: [],
};
const Input = ({ label, value, onChange, placeholder = "", type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={
        placeholder ||
        `Enter ${String(label)
          .replace(/\s*\*$/, "")
          .toLowerCase()}`
      }
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-gold"
    />
  </div>
);
const Area = ({ label, value, onChange, placeholder = "" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-3">
      {label}
    </label>
    <div className="quill-editor rounded-xl overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value ?? ""}
        onChange={(value) => onChange({ target: { value, type: "text" } })}
        placeholder={placeholder || `Write ${String(label).toLowerCase()}...`}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
        }}
      />
    </div>
  </div>
);
const MediaField = ({ label, value, onChange, alt }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="image-upload-area rounded-xl p-6 text-center border-2 border-dashed border-gray-700 hover:border-rose-gold transition-colors">
      {value ? (
        <div className="space-y-3">
          <Image
            unoptimized
            width={640}
            height={360}
            src={value}
            alt={alt || `${label} preview`}
            className="w-full h-40 object-cover rounded-lg"
          />
          <div className="featured-image-actions">
            <button
              type="button"
              className="featured-image-action bg-red-500 text-white"
              onClick={() => onChange({ target: { value: "", type: "text" } })}
            >
              Remove
            </button>
            <button
              type="button"
              className="featured-image-action bg-rose-gold text-white"
              onClick={() => setOpen(true)}
            >
              Change Image
            </button>
          </div>
        </div>
      ) : (
        <div className="py-5">
          <FaImage className="mx-auto text-4xl text-gray-500 mb-3" />
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <p className="text-gray-500 text-xs mb-4">
            Choose from media library or upload a new image
          </p>
          <button
            type="button"
            className="bg-rose-gold text-white px-4 py-2 rounded-lg"
            onClick={() => setOpen(true)}
          >
            Browse
          </button>
        </div>
      )}
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        mediaType="image"
        currentUrl={value}
        onSelect={(item) => {
          onChange({ target: { value: item.url, type: "text" } });
          setOpen(false);
        }}
      />
    </div>
  );
};
const buildCategoryTree = (rows) => {
  const nodes = new Map(rows.map((row) => [row._id, { ...row, children: [] }]));
  const roots = [];
  nodes.forEach((node) => {
    const parent = node.parentId ? nodes.get(String(node.parentId)) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (items) => items
    .sort((a, b) => (Number(a.order) - Number(b.order)) || a.name.localeCompare(b.name))
    .map((item) => ({ ...item, children: sort(item.children) }));
  return sort(roots);
};

const filterCategoryTree = (nodes, search) => {
  const query = search.trim().toLowerCase();
  if (!query) return nodes;
  return nodes.flatMap((node) => {
    const children = filterCategoryTree(node.children || [], query);
    const matches = [node.name, node.slug, node.description]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matches || children.length ? [{ ...node, children }] : [];
  });
};

function CategoryTreeList({ initialRows = null, initialError = "" }) {
  const [rows, setRows] = useState(initialRows ?? []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(initialRows === null);
  const [expanded, setExpanded] = useState(new Set());
  const [busyId, setBusyId] = useState("");
  const [drag, setDrag] = useState({ id: "", parentId: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getCatalog("categories");
    if (result.success) setRows(result.data);
    else toast.error(result.error || "Failed to load categories");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialRows !== null) return;
    if (initialError) toast.error(initialError);
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [initialRows, initialError, load]);

  useEffect(() => {
    if (!deleteTarget) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !busyId) setDeleteTarget(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteTarget, busyId]);

  const tree = buildCategoryTree(rows);
  const visibleTree = filterCategoryTree(tree, search);
  const stats = {
    total: rows.length,
    published: rows.filter((row) => row.status === "published" && row.isActive !== false).length,
    featured: rows.filter((row) => row.isFeatured).length,
  };

  const remove = async (category) => {
    setBusyId(category._id);
    const result = await deleteCatalogItem("categories", category._id);
    if (result.success) {
      toast.success(`"${category.name}" deleted successfully`);
      setDeleteTarget(null);
      await load();
    } else toast.error(result.error || "Failed to delete category");
    setBusyId("");
  };

  const toggleFeatured = async (category) => {
    setBusyId(category._id);
    const nextFeatured = !category.isFeatured;
    const result = await updateCatalogItem("categories", category._id, {
      ...category,
      children: undefined,
      parentId: category.parentId || null,
      isFeatured: nextFeatured,
    });
    if (result.success) {
      setRows((current) => current.map((row) => row._id === category._id ? result.data : row));
      toast.success(`Category ${nextFeatured ? "marked as featured" : "removed from featured"}`);
    } else toast.error(result.error || "Failed to update featured category");
    setBusyId("");
  };

  const reorder = async (target, parentId) => {
    if (!drag.id || drag.parentId !== parentId || drag.id === target._id) return;
    const siblings = rows
      .filter((row) => String(row.parentId || "") === parentId)
      .sort((a, b) => (Number(a.order) - Number(b.order)) || a.name.localeCompare(b.name));
    const from = siblings.findIndex((row) => row._id === drag.id);
    const to = siblings.findIndex((row) => row._id === target._id);
    if (from < 0 || to < 0) return;
    const ordered = [...siblings];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    setRows((current) => current.map((row) => {
      const index = ordered.findIndex((item) => item._id === row._id);
      return index < 0 ? row : { ...row, order: index };
    }));
    const results = await Promise.all(ordered.map((row, order) =>
      updateCatalogItem("categories", row._id, { ...row, children: undefined, parentId: row.parentId || null, order })));
    if (results.some((result) => !result.success)) {
      toast.error("Failed to save category order");
      await load();
    } else toast.success("Category order updated");
    setDrag({ id: "", parentId: "" });
  };

  const renderTree = (nodes, level = 0, parentId = "") => nodes.map((category) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expanded.has(category._id) || Boolean(search.trim());
    return (
      <div key={category._id} className={level ? "ml-8" : ""}>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => reorder(category, parentId)}
          className={`bg-gray-800/50 hover:bg-gray-800/70 rounded-xl p-4 transition-all duration-300 ${drag.id === category._id ? "opacity-50" : ""}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center min-w-0 flex-1">
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", category._id);
                  setDrag({ id: category._id, parentId });
                }}
                onDragEnd={() => setDrag({ id: "", parentId: "" })}
                className="category-drag-handle mr-2 p-1 text-gray-400 hover:text-rose-gold cursor-grab active:cursor-grabbing"
                aria-label={`Drag to reorder ${category.name}`}
                title="Drag to change display order"
              >
                <FaGripVertical />
              </button>
              {hasChildren ? (
                <button type="button" onClick={() => setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(category._id)) next.delete(category._id); else next.add(category._id);
                  return next;
                })} className="mr-3 text-gray-400 hover:text-rose-gold" aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name}`}>
                  <FaChevronDown className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                </button>
              ) : <span className="w-6 mr-3" />}
              <span className="relative w-12 h-12 shrink-0 bg-gradient-pink rounded-xl overflow-hidden grid place-items-center text-white">
                {category.image ? <Image unoptimized fill sizes="48px" src={category.image} alt={category.imageAltText || category.name} className="object-cover" /> : <FaImage />}
              </span>
              <span className="ml-3 min-w-0">
                <strong className="block text-white truncate">{category.name}</strong>
                <small className="block text-gray-400 truncate">{category.slug}{hasChildren ? ` · ${category.children.length} subcategories` : ""}</small>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`category-status-badge text-xs px-3 py-1 rounded-full ${category.status === "published" ? "category-status-published" : "category-status-draft"}`}>
                {category.status === "published" ? "Published" : "Draft"}
              </span>
              <button
                type="button"
                aria-pressed={Boolean(category.isFeatured)}
                aria-label={`${category.isFeatured ? "Remove" : "Add"} ${category.name} ${category.isFeatured ? "from" : "to"} featured categories`}
                title="Featured category"
                disabled={Boolean(busyId)}
                onClick={() => toggleFeatured(category)}
                className={`inline-grid size-9 place-items-center border-0 !bg-transparent text-xl transition hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${category.isFeatured ? "text-amber-400" : "text-gray-400 hover:text-amber-400"}`}
              >
                {busyId === category._id
                  ? <FaSpinner aria-hidden="true" className="animate-spin" />
                  : category.isFeatured
                    ? <FaStar aria-hidden="true" />
                    : <FaRegStar aria-hidden="true" />}
              </button>
              <Link href={`/admin/categories/edit/${category._id}`} onClick={() => rememberCatalogList("categories")} className="text-rose-gold hover:text-pink-600 p-2" aria-label={`Edit ${category.name}`}><FaEdit /></Link>
              <button type="button" disabled={busyId === category._id} onClick={() => setDeleteTarget(category)} className="text-red-400 hover:text-red-300 p-2 disabled:opacity-50" aria-label={`Delete ${category.name}`}>
                {busyId === category._id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              </button>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && <div className="space-y-2 mt-2">{renderTree(category.children, level + 1, category._id)}</div>}
      </div>
    );
  });

  return (
    <div className="catalog-module blog-workspace -mx-2 -mt-1 w-[calc(100%+16px)] max-w-none max-sm:mx-0 max-sm:mt-0 max-sm:w-full">
      <div className="mb-5 flex items-center justify-between gap-5">
        <p className="text-gray-700 font-bold">Organize your products with categories and subcategories</p>
        <Link href="/admin/categories/create" onClick={() => rememberCatalogList("categories")} className="bg-rose-gold hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium flex items-center shrink-0"><FaPlus className="mr-2" /> Add New Category</Link>
      </div>
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {[["Total Categories", stats.total, <FaTags key="total" /> , "bg-gradient-pink"], ["Published Categories", stats.published, <FaCheckCircle key="published" />, "bg-purple-500"], ["Featured Categories", stats.featured, <FaStar key="featured" />, "bg-blue-500"]].map(([label, value, icon, color]) => (
          <div key={String(label)} className="glassmorphism p-6 rounded-2xl shadow-md"><div className="flex justify-between items-start"><div><p className="text-gray-400 text-sm">{label}</p><h3 className="text-2xl font-bold text-white mt-2">{value}</h3></div><span className={`catalog-stat-icon ${color} p-3 rounded-xl text-xl`}>{icon}</span></div></div>
        ))}
      </div>
      <div className="glassmorphism p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-center gap-4 mb-6"><h2 className="text-xl font-semibold text-white">Category List</h2><div className="relative"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Category..." className="bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 w-64 text-white focus:outline-none focus:ring-2 focus:ring-rose-gold" /><FaSearch className="absolute left-3 top-3 text-gray-400" /></div></div>
        {loading ? <div className="flex justify-center items-center py-12"><FaSpinner className="animate-spin text-rose-gold text-3xl" /><span className="ml-3 text-gray-400">Loading categories...</span></div>
          : visibleTree.length ? <><div className="space-y-2">{renderTree(visibleTree)}</div><div className="mt-6 flex items-center justify-between gap-4 text-sm text-gray-400"><p>Showing {rows.length} categories</p><p><FaGripVertical className="inline mr-1" /> Drag categories to change display order</p></div></>
          : <div className="text-center py-12"><FaTags className="text-gray-500 text-4xl mx-auto mb-4" /><h3 className="text-xl font-medium text-gray-400 mb-2">No categories found</h3><p className="text-gray-500">{search ? "Try a different search term" : "Get started by creating your first category"}</p></div>}
      </div>
      {deleteTarget && (
        <div
          className="category-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyId) setDeleteTarget(null);
          }}
        >
          <section className="category-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="category-delete-title" aria-describedby="category-delete-description">
            <span className="category-confirm-icon" aria-hidden="true"><FaExclamationTriangle /></span>
            <div className="category-confirm-copy">
              <h2 id="category-delete-title">Delete category?</h2>
              <p id="category-delete-description">Are you sure you want to delete <strong>“{deleteTarget.name}”</strong>? This action cannot be undone.</p>
            </div>
            <div className="category-confirm-actions">
              <button type="button" className="category-confirm-cancel" disabled={busyId === deleteTarget._id} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="category-confirm-delete" disabled={busyId === deleteTarget._id} onClick={() => remove(deleteTarget)}>
                {busyId === deleteTarget._id ? <><FaSpinner className="animate-spin" /> Deleting...</> : <><FaTrash /> Delete Category</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function AttributeList({ initialRows = null, initialError = "" }) {
  const [rows, setRows] = useState(initialRows ?? []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(initialRows === null);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterToggleId, setFilterToggleId] = useState("");
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getCatalog("attributes");
    if (result.success) setRows(result.data);
    else toast.error(result.error || "Failed to load attributes");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialRows !== null) return;
    if (initialError) toast.error(initialError);
    const frame = requestAnimationFrame(load);
    return () => cancelAnimationFrame(frame);
  }, [initialRows, initialError, load]);

  useEffect(() => {
    if (!deleteTarget) return;
    const close = (event) => event.key === "Escape" && !deleting && setDeleteTarget(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [deleteTarget, deleting]);

  const filtered = rows.filter((row) => [row.name, row.slug]
    .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase())));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalTerms = rows.reduce((sum, row) => sum + (row.terms?.length || 0), 0);

  const remove = async () => {
    setDeleting(true);
    const result = await deleteCatalogItem("attributes", deleteTarget._id);
    if (result.success) {
      toast.success("Attribute deleted successfully");
      setDeleteTarget(null);
      await load();
    } else toast.error(result.error || "Failed to delete attribute");
    setDeleting(false);
  };

  const toggleFilterVisibility = async (attribute) => {
    if (filterToggleId) return;
    setFilterToggleId(attribute._id);
    const showInFilters = attribute.showInFilters === false;
    const result = await updateCatalogItem("attributes", attribute._id, { ...attribute, showInFilters, parentId: null });
    if (result.success) {
      setRows((current) => current.map((row) => row._id === attribute._id ? result.data : row));
      toast.success(`${attribute.name} ${showInFilters ? "will show" : "will not show"} in storefront filters`);
    } else toast.error(result.error || "Failed to update filter visibility");
    setFilterToggleId("");
  };

  return (
    <div className="catalog-module blog-workspace">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <p className="text-gray-700 font-bold">Manage product attributes and their terms</p>
        <div className="flex gap-4">
          <button type="button" disabled={loading} onClick={() => { load(); toast("Refreshing data..."); }} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-medium flex items-center"><FaSync className={`mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
          <Link href="/admin/attributes/create" onClick={() => rememberCatalogList("attributes")} className="bg-rose-gold hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium flex items-center"><FaPlus className="mr-2" /> Add New Attribute</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[["Total Attributes", rows.length, <FaList key="attributes" />, "bg-gradient-pink"], ["Total Terms", totalTerms, <FaTags key="terms" />, "bg-purple-500"], ["Average Terms", rows.length ? Math.round(totalTerms / rows.length) : 0, <FaList key="average" />, "bg-blue-500"]].map(([label, value, icon, color]) => (
          <div key={String(label)} className="glassmorphism p-6 rounded-2xl shadow-md"><div className="flex justify-between items-start"><div><p className="text-gray-400 text-sm">{label}</p><h3 className="text-2xl font-bold text-white mt-2">{loading ? "..." : value}</h3></div><span className={`catalog-stat-icon ${color} p-3 rounded-xl text-xl`}>{icon}</span></div></div>
        ))}
      </div>
      <div className="glassmorphism p-6 rounded-2xl shadow-md mb-6">
        <div className="flex gap-4"><div className="relative flex-1"><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search attributes..." className="bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-rose-gold" /><FaSearch className="absolute left-3 top-3.5 text-gray-400" /></div>{search && <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl flex items-center"><FaTimes className="mr-2" /> Clear Search</button>}</div>
      </div>
      <div className="glassmorphism p-6 rounded-2xl shadow-md overflow-x-auto">
        {loading ? <div className="flex justify-center py-12"><FaSpinner className="text-rose-gold text-4xl animate-spin" /></div> : (
          <table className="w-full"><thead><tr className="border-b border-gray-700 text-gray-400 text-left"><th className="py-3 px-4">Name</th><th className="py-3 px-4">Slug</th><th className="py-3 px-4">Terms</th><th className="py-3 px-4 text-center">Show in Filter</th><th className="py-3 px-4 text-right">Actions</th></tr></thead><tbody>
            {visible.length ? visible.map((attribute) => { const showInFilters = attribute.showInFilters !== false; const toggling = filterToggleId === attribute._id; return <tr key={attribute._id} className="border-b border-gray-800 hover:bg-gray-800/50"><td className="py-4 px-4 text-white font-medium">{attribute.name}</td><td className="py-4 px-4 text-gray-400">{attribute.slug}</td><td className="py-4 px-4"><div className="flex flex-wrap gap-1">{attribute.terms?.slice(0, 3).map((item, index) => <span key={`${item}-${index}`} className="attribute-term-pill px-2 py-1 text-xs rounded-full">{item}</span>)}{attribute.terms?.length > 3 && <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">+{attribute.terms.length - 3} more</span>}</div></td><td className="py-4 px-4 text-center"><button type="button" role="switch" aria-checked={showInFilters} aria-label={`${showInFilters ? "Hide" : "Show"} ${attribute.name} in storefront filters`} disabled={Boolean(filterToggleId)} onClick={() => toggleFilterVisibility(attribute)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${showInFilters ? "bg-violet-600" : "bg-gray-600"}`}><span aria-hidden="true" className={`inline-block size-[18px] rounded-full bg-white shadow transition-transform ${showInFilters ? "translate-x-[23px]" : "translate-x-[3px]"}`} />{toggling && <FaSpinner className="absolute left-[15px] text-[12px] text-white animate-spin" />}</button></td><td className="py-4 px-4"><div className="flex justify-end gap-2"><Link href={`/admin/attributes/edit/${attribute._id}`} onClick={() => rememberCatalogList("attributes")} className="text-rose-gold p-2 hover:bg-gray-700 rounded-lg" aria-label={`Edit ${attribute.name}`}><FaEdit /></Link><button type="button" onClick={() => setDeleteTarget(attribute)} className="text-red-400 p-2 hover:bg-gray-700 rounded-lg" aria-label={`Delete ${attribute.name}`}><FaTrash /></button></div></td></tr>; }) : <tr><td colSpan="5" className="py-12 text-center text-gray-400">No attributes found</td></tr>}
          </tbody></table>
        )}
        {pages > 1 && <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700"><p className="text-gray-400">Page {page} of {pages} · {filtered.length} total attributes</p><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="bg-gray-800 p-3 rounded-lg disabled:opacity-50"><FaChevronLeft /></button>{Array.from({ length: pages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.max(5, page + 2)).map((number) => <button type="button" key={number} onClick={() => setPage(number)} className={`px-4 py-2 rounded-lg ${page === number ? "bg-rose-gold text-white" : "bg-gray-800 text-gray-300"}`}>{number}</button>)}<button type="button" disabled={page === pages} onClick={() => setPage((value) => value + 1)} className="bg-gray-800 p-3 rounded-lg disabled:opacity-50"><FaChevronRight /></button></div></div>}
      </div>
      {deleteTarget && <div className="category-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !deleting && setDeleteTarget(null)}><section className="category-confirm-modal" role="dialog" aria-modal="true"><span className="category-confirm-icon"><FaExclamationTriangle /></span><div className="category-confirm-copy"><h2>Delete attribute?</h2><p>Are you sure you want to delete <strong>“{deleteTarget.name}”</strong>? This action cannot be undone.</p></div><div className="category-confirm-actions"><button type="button" className="category-confirm-cancel" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="category-confirm-delete" disabled={deleting} onClick={remove}>{deleting ? <><FaSpinner className="animate-spin" /> Deleting...</> : <><FaTrash /> Delete Attribute</>}</button></div></section></div>}
    </div>
  );
}

function FlatCatalogList({ kind, initialRows = null, initialError = "" }) {
  const [one, plural] = info(kind),
    [rows, setRows] = useState(initialRows ?? []),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(initialRows === null),
    [deleteTarget, setDeleteTarget] = useState(null),
    [selectedIds, setSelectedIds] = useState([]),
    [bulkDeleteOpen, setBulkDeleteOpen] = useState(false),
    [deleting, setDeleting] = useState(false);
  const publishedCount = rows.filter((row) => row.status === "published").length;
  const thirdStat = kind === "brands"
    ? { label: "Featured Brands", value: rows.filter((row) => row.isFeatured).length, icon: <FaStar />, color: "bg-blue-500" }
    : { label: "Draft Tags", value: rows.filter((row) => row.status === "draft").length, icon: <FaList />, color: "bg-blue-500" };
  const load = useCallback(async () => {
    setLoading(true);
    const r = await getCatalog(kind, search);
    if (r.success) setRows(r.data);
    else toast.error(r.error);
    setLoading(false);
  }, [kind, search]);
  useEffect(() => {
    if (initialRows !== null && !search) return;
    if (initialError && !search) toast.error(initialError);
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [initialRows, initialError, load, search]);

  useEffect(() => {
    if (!deleteTarget && !bulkDeleteOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !deleting) {
        setDeleteTarget(null);
        setBulkDeleteOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteTarget, bulkDeleteOpen, deleting]);

  const remove = async (x) => {
    setDeleting(true);
    const r = await deleteCatalogItem(kind, x._id);
    if (r.success) {
      toast.success(`${one} deleted successfully`);
      setSelectedIds((current) => current.filter((id) => id !== x._id));
      setDeleteTarget(null);
      await load();
    } else toast.error(r.error);
    setDeleting(false);
  };
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row._id));
  const toggleAll = () => setSelectedIds(allVisibleSelected ? [] : rows.map((row) => row._id));
  const toggleSelected = (id) => setSelectedIds((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]);
  const removeSelected = async () => {
    if (kind !== "tags" || !selectedIds.length) return;
    setDeleting(true);
    const result = await bulkDeleteCatalogItems("tags", selectedIds);
    if (result.success) {
      toast.success(`${result.deletedCount} tag${result.deletedCount === 1 ? "" : "s"} deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await load();
    } else toast.error(result.error || "Could not delete the selected tags");
    setDeleting(false);
  };
  return (
    <div className="catalog-module blog-workspace space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-gray-700">
          Manage product {plural.toLowerCase()}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {kind === "tags" && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              <FaTrash /> Delete selected ({selectedIds.length})
            </button>
          )}
          <Link
            href={`/admin/${kind}/create`}
            onClick={() => rememberCatalogList(kind)}
            className="bg-rose-gold text-white px-4 py-2 rounded-xl inline-flex gap-2 items-center"
          >
            <FaPlus /> Create {one}
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: `Total ${plural}`, value: rows.length, icon: kind === "brands" ? <FaImage /> : <FaTags />, color: "bg-gradient-pink" },
          { label: `Published ${plural}`, value: publishedCount, icon: <FaCheckCircle />, color: "bg-purple-500" },
          thirdStat,
        ].map((stat) => (
          <div key={stat.label} className="glassmorphism p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white mt-2">{loading ? "..." : stat.value}</h3>
              </div>
              <span className={`catalog-stat-icon ${stat.color} p-3 rounded-xl text-xl`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="glassmorphism rounded-2xl p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 py-2.5"
            placeholder={`Search ${plural.toLowerCase()}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
            }}
          />
        </div>
      </div>
      <div className="glassmorphism rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {kind === "tags" && (
                <th className="w-14 px-5 py-3 text-left">
                  <input className="size-4" style={{ accentColor: "var(--admin-primary)" }} type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all tags" />
                </th>
              )}
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Slug</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="blog-table-skeleton">
                  <td colSpan={kind === "tags" ? 5 : 4} className="p-4">
                    <span className="blog-skeleton-block w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length ? (
              rows.map((x) => (
                <tr key={x._id}>
                  {kind === "tags" && (
                    <td className="px-5 py-4">
                      <input className="size-4" style={{ accentColor: "var(--admin-primary)" }} type="checkbox" checked={selectedIds.includes(x._id)} onChange={() => toggleSelected(x._id)} aria-label={`Select ${x.name}`} />
                    </td>
                  )}
                  <td className="px-5 py-4 font-medium">
                    {kind === "brands" ? (
                      <div className="flex items-center gap-3">
                        <span className="relative w-11 h-11 shrink-0 overflow-hidden rounded-xl bg-gradient-pink grid place-items-center text-white">
                          {x.logo ? (
                            <Image
                              unoptimized
                              fill
                              sizes="44px"
                              src={x.logo}
                              alt={x.imageAltText || x.name}
                              className="object-cover"
                            />
                          ) : <FaImage aria-hidden="true" />}
                        </span>
                        <span>{x.name}</span>
                      </div>
                    ) : x.name}
                  </td>
                  <td className="px-5 py-4 text-gray-400">{x.slug}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`blog-status-pill ${x.status === "published" && x.isActive !== false ? "blog-status-published" : "blog-status-draft"}`}
                    >
                      {x.isActive === false ? "Inactive" : x.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/${kind}/edit/${x._id}`}
                        onClick={() => rememberCatalogList(kind)}
                        className="admin-row-action"
                      >
                        <FaEdit /> Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(x)}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg inline-flex gap-2 items-center"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-8 text-center text-gray-400" colSpan={kind === "tags" ? 5 : 4}>
                  No {plural.toLowerCase()} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {deleteTarget && (
        <div
          className="category-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <section className="category-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-delete-title" aria-describedby="catalog-delete-description">
            <span className="category-confirm-icon" aria-hidden="true"><FaExclamationTriangle /></span>
            <div className="category-confirm-copy">
              <h2 id="catalog-delete-title">Delete {one.toLowerCase()}?</h2>
              <p id="catalog-delete-description">Are you sure you want to delete <strong>“{deleteTarget.name}”</strong>? This action cannot be undone.</p>
            </div>
            <div className="category-confirm-actions">
              <button type="button" className="category-confirm-cancel" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="category-confirm-delete" disabled={deleting} onClick={() => remove(deleteTarget)}>
                {deleting ? <><FaSpinner className="animate-spin" /> Deleting...</> : <><FaTrash /> Delete {one}</>}
              </button>
            </div>
          </section>
        </div>
      )}
      {bulkDeleteOpen && (
        <div
          className="category-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setBulkDeleteOpen(false);
          }}
        >
          <section className="category-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-tag-delete-title" aria-describedby="bulk-tag-delete-description">
            <span className="category-confirm-icon" aria-hidden="true"><FaExclamationTriangle /></span>
            <div className="category-confirm-copy">
              <h2 id="bulk-tag-delete-title">Delete selected tags?</h2>
              <p id="bulk-tag-delete-description">Are you sure you want to delete <strong>{selectedIds.length} selected tag{selectedIds.length === 1 ? "" : "s"}</strong>? They will also be removed from assigned products. This action cannot be undone.</p>
            </div>
            <div className="category-confirm-actions">
              <button type="button" className="category-confirm-cancel" disabled={deleting} onClick={() => setBulkDeleteOpen(false)}>Cancel</button>
              <button type="button" className="category-confirm-delete" disabled={deleting} onClick={() => void removeSelected()}>
                {deleting ? <><FaSpinner className="animate-spin" /> Deleting...</> : <><FaTrash /> Delete selected</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function CatalogList({ kind, initialRows = null, initialError = "" }) {
  return kind === "categories"
    ? <CategoryTreeList initialRows={initialRows} initialError={initialError} />
    : kind === "attributes"
      ? <AttributeList initialRows={initialRows} initialError={initialError} />
    : <FlatCatalogList kind={kind} initialRows={initialRows} initialError={initialError} />;
}
function GenericCatalogEditor({ kind, id = "", initialItem = null, initialError = "", initialParents = null }) {
  const [one] = info(kind),
    router = useRouter(),
    editing = Boolean(id),
    [form, setForm] = useState(() => initialItem ? {
      ...blank,
      ...initialItem,
      parentId: initialItem.parentId || "",
      terms: initialItem.terms || [],
    } : blank),
    [slugManuallyEdited, setSlugManuallyEdited] = useState(false),
    [term, setTerm] = useState(""),
    [parents, setParents] = useState(initialParents ?? []),
    [saving, setSaving] = useState(false),
    [loading, setLoading] = useState(editing && !initialItem && !initialError),
    [loadError, setLoadError] = useState(initialError);
  const set = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const setName = (e) => {
    const name = e.target.value;
    setForm((current) => ({
      ...current,
      name,
      slug: slugManuallyEdited ? current.slug : createSlug(name),
    }));
  };
  const setSlug = (e) => {
    setSlugManuallyEdited(true);
    setForm((current) => ({ ...current, slug: createSlug(e.target.value) }));
  };
  useEffect(() => {
    if (kind !== "categories" || initialParents !== null) return;
    getCatalog("categories").then((r) => {
      if (r.success) setParents(r.data.filter((x) => x._id !== id));
      else toast.error(r.error);
    });
  }, [kind, id, initialParents]);
  useEffect(() => {
    if (!editing || initialItem || initialError) return;
    let active = true;
    getCatalogItem(kind, id).then((r) => {
      if (!active) return;
      if (r.success) {
          setForm({
            ...blank,
            ...r.data,
            parentId: r.data.parentId || "",
            terms: r.data.terms || [],
          });
      } else {
        setLoadError(r.error || `${one} could not be loaded.`);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [editing, kind, id, one, initialItem, initialError]);
  const save = async (targetStatus = form.status) => {
    if (saving) return;
    if (form.name.trim().length < 2)
      return toast.error(`${one} name must be at least 2 characters.`);
    setSaving(true);
    const payload = {
      ...form,
      status: targetStatus,
      parentId: form.parentId || null,
    };
    const r = editing
      ? await updateCatalogItem(kind, id, payload)
      : await createCatalogItem(kind, payload);
    setSaving(false);
    if (r.success) {
      toast.success(editing
        ? `${one} updated successfully`
        : `${one} created successfully`);
      try { sessionStorage.removeItem(catalogReturnKey(kind)); } catch { /* Continue navigation. */ }
      router.push(`/admin/${kind}`);
      router.refresh();
    } else {
      toast.error(r.error || (editing
        ? `Failed to update ${one.toLowerCase()}`
        : `Failed to create ${one.toLowerCase()}`));
    }
  };
  const goBack = () => {
    let restorePreviousRoute = false;
    try {
      restorePreviousRoute = sessionStorage.getItem(catalogReturnKey(kind)) === "true";
      sessionStorage.removeItem(catalogReturnKey(kind));
    } catch { /* Fall back to the explicit catalog route. */ }
    if (restorePreviousRoute) router.back();
    else router.push(`/admin/${kind}`);
  };
  const toggle = (k, t, description = "") => (
    <label className="catalog-switch-row">
      <span className="catalog-switch-copy">
        <strong>{t}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" checked={!!form[k]} onChange={set(k)} />
      <span className="catalog-switch" aria-hidden="true">
        <span />
      </span>
    </label>
  );
  if (loading)
    return (
      <div className="catalog-module blog-workspace">
        <div className="glassmorphism rounded-2xl p-6 animate-pulse h-64" />
      </div>
    );
  if (loadError)
    return (
      <div className="catalog-module blog-workspace">
        <section className="glassmorphism rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">{one} unavailable</h1>
          <p className="text-gray-400">{loadError}</p>
          <Link href={`/admin/${kind}`} className="admin-row-action inline-flex">
            <FaArrowLeft /> Back to {info(kind)[1]}
          </Link>
        </section>
      </div>
    );
  const seo = (
    <section className="glassmorphism rounded-2xl p-6 shadow-md space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <FaGlobe /> SEO Settings
      </h2>
      <Input
        label="SEO Title"
        value={kind === "brands" ? form.title : form.seoTitle}
        onChange={set(kind === "brands" ? "title" : "seoTitle")}
        placeholder={`Enter an SEO-friendly ${one.toLowerCase()} title`}
      />
      <Area
        label="SEO Description"
        value={form.seoDescription}
        onChange={set("seoDescription")}
        placeholder="Write a concise description for search results..."
      />
      <Input
        label="Focus Keywords"
        value={form.focusKeywords}
        onChange={set("focusKeywords")}
        placeholder="keyword1, keyword2, keyword3"
      />
      <Input
        label="Canonical URL"
        value={form.canonicalUrl}
        onChange={set("canonicalUrl")}
        type="url"
        placeholder={`https://example.com/${one.toLowerCase()}/${one.toLowerCase()}-slug`}
      />
      <Area
        label="Schema Markup"
        value={form.schemaMarkup}
        onChange={set("schemaMarkup")}
        placeholder="Add JSON-LD schema markup..."
      />
    </section>
  );
  return (
    <div className="catalog-module blog-workspace blog-editor-page catalog-editor space-y-6 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          {editing ? "Edit" : "Create"} {one}
        </h1>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className={`${kind === "tags" || kind === "attributes" ? "xl:col-span-12" : "xl:col-span-8"} space-y-6`}>
          <section className="glassmorphism rounded-2xl p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-white">
              Basic Information
            </h2>
            <Input
              label={`${one} Name *`}
              value={form.name}
              onChange={setName}
              placeholder={`Enter ${one.toLowerCase()} name`}
            />
            <Input
              label="Slug *"
              value={form.slug}
              onChange={setSlug}
              placeholder={`enter-${one.toLowerCase()}-slug`}
            />
            {kind === "categories" && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Parent Category
                </label>
                <select
                  value={form.parentId}
                  onChange={set("parentId")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-gold"
                >
                  <option value="">No Parent (Top Level Category)</option>
                  {parents.map((x) => (
                    <option key={x._id} value={x._id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(kind === "categories" || kind === "brands") && (
              <Area
                label="Description"
                value={form.description}
                onChange={set("description")}
                placeholder="Write the category description..."
              />
            )}{" "}
            {kind === "categories" && (
              <>
                <Area
                  label="Bottom Content"
                  value={form.bottomContent}
                  onChange={set("bottomContent")}
                  placeholder="Write content to display below the category products..."
                />
              </>
            )}
            {kind === "brands" && (
              <Area
                label="Bottom Content"
                value={form.bottomContent}
                onChange={set("bottomContent")}
              />
            )}
          </section>
          {kind === "attributes" && (
            <section className="glassmorphism rounded-2xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-white mb-4">Terms</h2>
              <div className="flex gap-2">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Enter term name"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
                />
                <button
                  type="button"
                  onClick={() => {
                    const x = term.trim();
                    if (x && !form.terms.includes(x)) {
                      setForm({ ...form, terms: [...form.terms, x] });
                      setTerm("");
                    }
                  }}
                  className="bg-rose-gold text-white px-4 rounded-xl"
                >
                  <FaPlus /> Add
                </button>
              </div>
              <div className="space-y-2 mt-4">
                {form.terms.map((x, i) => (
                  <div key={`${x}-${i}`} className="flex gap-2">
                    <input
                      value={x}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          terms: form.terms.map((v, n) =>
                            n === i ? e.target.value : v,
                          ),
                        })
                      }
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          terms: form.terms.filter((_, n) => n !== i),
                        })
                      }
                      className="text-red-500 px-3"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {(kind === "categories" || kind === "brands") && seo}
        </div>
        {(kind === "categories" || kind === "brands") && <aside className="xl:col-span-4 space-y-6">
          {kind === "categories" && (
            <section className="glassmorphism rounded-2xl p-5 shadow-md space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaImage /> Category Image
              </h2>
              <MediaField
                label="Category Image"
                value={form.image}
                onChange={set("image")}
                alt={form.imageAltText}
              />
            </section>
          )}
          {kind === "brands" && (
            <section className="glassmorphism rounded-2xl p-5 shadow-md space-y-4">
              <h2 className="text-lg font-semibold text-white">Brand Logo</h2>
              <MediaField
                label="Brand Logo"
                value={form.logo}
                onChange={set("logo")}
              />
            </section>
          )}
          <section className="glassmorphism rounded-2xl p-5 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-white">
              {kind === "brands"
                  ? "Settings"
                  : kind === "categories"
                    ? "Category Settings"
                    : "Status & Settings"}
            </h2>
              <>
                {kind === "brands" && toggle(
                  "isFeatured",
                  "Featured Brand",
                  "Highlight this brand in featured sections.",
                )}
                {kind === "categories" && (
                  <>
                    {toggle(
                      "isFeatured",
                      "Featured category",
                      "Highlight this category in featured sections.",
                    )}
                    {toggle(
                      "showInNavigation",
                      "Show in navigation menu",
                      "Make this category visible in store navigation.",
                    )}
                  </>
                )}
                {kind === "brands" &&
                  toggle("showOnHomepage", "Show on homepage")}
                {kind !== "attributes" && kind !== "categories" && kind !== "brands" && (
                  <Input
                    label="Display Order"
                    value={form.order}
                    onChange={set("order")}
                    type="number"
                  />
                )}
              </>
          </section>
        </aside>}
      </div>
      <section className="blog-publish-bar" aria-label="Publish Settings">
        <div className="blog-publish-bar-copy">
          <span className="blog-publish-bar-icon">
            <FaCalendarAlt />
          </span>
          <div>
            <strong>Publish Settings</strong>
            <small>Save as draft or publish this {one.toLowerCase()}.</small>
          </div>
        </div>
        <div className="blog-publish-bar-actions">
          <label className="blog-publish-status">
            <span>Status</span>
            <select
              value={form.status}
              onChange={set("status")}
              disabled={saving}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(form.status)}
            className="blog-publish-submit"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" /> Saving
              </>
            ) : (
              <>
                <FaSave /> {editing ? "Save Changes" : `Create ${one}`}
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

function AttributeEditor({ id = "", initialItem = null, initialError = "" }) {
  const router = useRouter();
  const editing = Boolean(id);
  const [form, setForm] = useState({
    ...blank,
    ...initialItem,
    name: initialItem?.name || "",
    slug: initialItem?.slug || "",
    terms: initialItem?.terms || [],
    status: initialItem?.status || "published",
  });
  const [newTerm, setNewTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const updateName = (event) => {
    const name = event.target.value;
    setForm((current) => ({ ...current, name, slug: createSlug(name) }));
    setErrors((current) => ({ ...current, name: "" }));
  };
  const updateSlug = (event) => {
    setForm((current) => ({ ...current, slug: createSlug(event.target.value) }));
    setErrors((current) => ({ ...current, slug: "" }));
  };
  const addTerm = () => {
    const value = newTerm.trim();
    if (!value) return toast.error("Please enter a term");
    if (form.terms.some((item) => item.toLowerCase() === value.toLowerCase())) return toast.error("This term already exists");
    setForm((current) => ({ ...current, terms: [...current.terms, value] }));
    setNewTerm("");
    setErrors((current) => ({ ...current, terms: "" }));
    toast.success("Term added");
  };
  const removeTerm = (index) => {
    setForm((current) => ({ ...current, terms: current.terms.filter((_, itemIndex) => itemIndex !== index) }));
    toast.success("Term removed");
  };
  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Attribute name is required";
    else if (form.name.trim().length < 2) next.name = "Attribute name must be at least 2 characters";
    if (!form.slug.trim()) next.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) next.slug = "Slug must use lowercase letters, numbers, and hyphens";
    if (!form.terms.length || form.terms.some((item) => !item.trim())) next.terms = "Please add at least one valid term";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const save = async () => {
    if (saving || !validate()) {
      if (!saving) toast.error("Please fix the errors in the form");
      return;
    }
    setSaving(true);
    const payload = { ...form, name: form.name.trim(), slug: form.slug.trim(), terms: form.terms.map((item) => item.trim()), parentId: null };
    const result = editing ? await updateCatalogItem("attributes", id, payload) : await createCatalogItem("attributes", payload);
    setSaving(false);
    if (!result.success) return toast.error(result.error || `Failed to ${editing ? "update" : "create"} attribute`);
    toast.success(`Attribute ${editing ? "updated" : "created"} successfully`);
    try { sessionStorage.removeItem(catalogReturnKey("attributes")); } catch { /* Continue navigation. */ }
    router.push("/admin/attributes");
    router.refresh();
  };
  const goBack = () => {
    let restorePreviousRoute = false;
    try {
      restorePreviousRoute = sessionStorage.getItem(catalogReturnKey("attributes")) === "true";
      sessionStorage.removeItem(catalogReturnKey("attributes"));
    } catch { /* Fall back to an explicit route. */ }
    if (restorePreviousRoute) router.back();
    else router.push("/admin/attributes");
  };

  if (initialError) return <div className="catalog-module blog-workspace"><section className="glassmorphism rounded-2xl p-8 text-center space-y-4"><h1 className="text-xl font-bold text-white">Attribute unavailable</h1><p className="text-gray-400">{initialError}</p><Link href="/admin/attributes" className="admin-row-action inline-flex"><FaArrowLeft /> Back to Attributes</Link></section></div>;

  return (
    <div className="catalog-module blog-workspace blog-editor-page catalog-editor space-y-6 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-xl font-bold text-white">{editing ? "Edit Attribute" : "Create New Attribute"}</h1><p className="text-sm text-gray-400">{editing ? "Update existing product attribute and terms" : "Add a new product attribute with terms"}</p></div>
        <button type="button" onClick={goBack} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-medium flex items-center"><FaArrowLeft className="mr-2" /> Back</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="glassmorphism p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center"><FaList className="mr-2" /> Basic Information</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Attribute Name *</label><input value={form.name} onChange={updateName} className={`bg-gray-800 border ${errors.name ? "border-red-500" : "border-gray-700"} rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-rose-gold`} placeholder="e.g., BENEFITS, INGREDIENTS, SKIN TYPE" />{errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Slug *</label><input value={form.slug} onChange={updateSlug} className={`bg-gray-800 border ${errors.slug ? "border-red-500" : "border-gray-700"} rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-rose-gold`} placeholder="attribute-slug" />{errors.slug && <p className="text-red-400 text-sm mt-1">{errors.slug}</p>}<p className="text-gray-500 text-xs mt-1">URL-friendly version (auto-generated)</p></div>
            </div>
          </section>
          <section className="glassmorphism p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-white mb-4">Terms</h2>
            <div className="bg-gray-800/50 p-4 rounded-xl mb-4"><h3 className="text-sm font-medium text-gray-300 mb-3">Add New Term</h3><div className="flex gap-3"><input value={newTerm} onChange={(event) => setNewTerm(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTerm(); } }} placeholder="Enter term name" className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-rose-gold" /><button type="button" onClick={addTerm} className="bg-rose-gold hover:bg-pink-600 text-white px-6 py-2 rounded-lg flex items-center"><FaPlus className="mr-2" /> Add</button></div></div>
            {errors.terms && <p className="text-red-400 text-sm mb-3">{errors.terms}</p>}
            {!form.terms.length ? <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl"><FaList className="text-gray-600 text-3xl mx-auto mb-2" /><p className="text-gray-400">No terms added yet</p><p className="text-gray-500 text-sm">Add terms using the form above</p></div> : <div className="space-y-2"><p className="text-sm text-gray-400 mb-3">{form.terms.length} term(s) added</p>{form.terms.map((item, index) => <div key={index} className="bg-gray-800/50 p-3 rounded-xl flex items-center gap-3 hover:bg-gray-800"><span className="text-gray-400 text-sm w-8">{index + 1}.</span><input value={item} onChange={(event) => setForm((current) => ({ ...current, terms: current.terms.map((term, itemIndex) => itemIndex === index ? event.target.value : term) }))} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-rose-gold text-white" /><button type="button" onClick={() => removeTerm(index)} className="text-red-400 hover:text-red-300 p-2 hover:bg-gray-700 rounded-lg"><FaTrash /></button></div>)}</div>}
          </section>
        </div>
        <aside className="space-y-6"><section className="glassmorphism p-6 rounded-2xl shadow-md"><h2 className="text-lg font-bold text-white mb-4">Summary</h2><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-400">Terms Added:</span><strong className="text-white">{form.terms.length}</strong></div><div className="flex justify-between"><span className="text-gray-400">Name Length:</span><strong className="text-white">{form.name.length} chars</strong></div><div className="flex justify-between gap-4"><span className="text-gray-400">Slug:</span><strong className="text-white text-xs break-all text-right">{form.slug || "auto"}</strong></div></div></section></aside>
      </div>
      <section className="blog-publish-bar" aria-label="Publish Settings"><div className="blog-publish-bar-copy"><span className="blog-publish-bar-icon"><FaCalendarAlt /></span><div><strong>Publish Settings</strong><small>Save as draft or publish this attribute.</small></div></div><div className="blog-publish-bar-actions"><label className="blog-publish-status"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} disabled={saving}><option value="draft">Draft</option><option value="published">Published</option></select></label><button type="button" disabled={saving} onClick={save} className="blog-publish-submit">{saving ? <><FaSpinner className="animate-spin" /> Saving</> : <><FaSave /> {editing ? "Save Changes" : "Create Attribute"}</>}</button></div></section>
    </div>
  );
}

export function CatalogEditor(props) {
  return props.kind === "attributes" ? <AttributeEditor {...props} /> : <GenericCatalogEditor {...props} />;
}
