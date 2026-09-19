/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Legacy editor migration; remove after API contracts are consolidated.
"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaCode,
  FaEdit,
  FaGlobe,
  FaImage,
  FaLink,
  FaPlus,
  FaSave,
  FaSpinner,
  FaTags,
  FaTrash,
} from "react-icons/fa";
import {
  createBlog,
  createBlogCategory,
  createBlogTag,
  deleteBlogCategory,
  deleteBlogTag,
  getBlogFormMeta,
  updateBlog,
  updateBlogCategory,
  updateBlogTag,
} from "@/lib/blogs-client";
import MediaPickerModal from "@/components/media/media-picker";
import { clearBlogListReturn, consumeBlogListReturn } from "@/lib/blog-navigation";
import { parseBulkTagNames } from "@/lib/tag-input";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
    ["link", "image", "code-block"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "align",
  "link",
  "image",
  "code-block",
];

const schemaMarkupModules = {
  toolbar: [
    ["code-block"],
    ["bold", "italic"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const schemaMarkupFormats = ["code-block", "bold", "italic", "list"];

const cleanQuillHTML = (html) => {
  if (!html) return html;

  let cleaned = html;
  cleaned = cleaned.replace(/&nbsp;/g, " ");
  cleaned = cleaned.replace(/<p><\/p>/g, "");
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned.trim();
};

const countTextCharacters = (html) => {
  if (!html) return 0;
  const plainText = html.replace(/<[^>]*>/g, "").trim();
  return plainText.length;
};

export default function BlogEditorForm({ mode = "create", initialBlog = null }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const toKeywordsString = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(", ");
    }
    if (typeof value === "string") {
      return value;
    }
    return "";
  };

  const buildFormState = (blog = null) => ({
    title: blog?.title || "",
    content: blog?.content || "",
    featuredImage: blog?.featuredImage || "",
    categories: blog?.categories?.map((c) => c._id) || [],
    tags: blog?.tags?.map((t) => t._id) || [],
    status: blog?.status || "draft",
    publishDate: blog?.publishDate
      ? new Date(blog.publishDate).toISOString()
      : "",
    seoTitle: blog?.seo?.title || blog?.seoTitle || blog?.title || "",
    seoDescription:
      blog?.seo?.seoDescription ||
      blog?.seo?.description ||
      blog?.seoDescription ||
      blog?.metaDescription ||
      "",
    focusKeywords: toKeywordsString(
      blog?.seo?.focusKeywords ??
        blog?.seo?.keywords ??
        blog?.focusKeywords ??
        blog?.keywords ??
        ""
    ),
    schemaMarkup: blog?.seo?.schemaMarkup || blog?.seo?.schema || blog?.schemaMarkup || "",
    canonicalUrl:
      blog?.seo?.canonicalUrl || blog?.seo?.canonical || blog?.canonicalUrl || "",
  });

  const [form, setForm] = useState(() => buildFormState(initialBlog));



  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const imageTarget = useRef(null);
  const editorModules = useMemo(() => ({
    ...quillModules,
    toolbar: {
      container: quillModules.toolbar,
      handlers: {
        image: function () {
          imageTarget.current = { editor: this.quill, index: this.quill.getSelection()?.index ?? this.quill.getLength() - 1 };
          setMediaOpen(true);
        },
      },
    },
  }), []);

  const publishPortalTarget = useSyncExternalStore(
    () => () => {},
    () => document.querySelector(".admin-main"),
    () => null
  );

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);

  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTags, setIsCreatingTags] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingTagId, setEditingTagId] = useState("");
  const [editingTagName, setEditingTagName] = useState("");

  const debouncedCategorySearch = useDebouncedValue(categorySearch, 350);
  const debouncedTagSearch = useDebouncedValue(tagSearch, 350);

  const selectedTags = useMemo(
    () => tags.filter((tag) => form.tags.includes(tag._id)),
    [tags, form.tags]
  );

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      setLoadingTaxonomies(true);
      const res = await getBlogFormMeta({
        categorySearch: debouncedCategorySearch,
        tagSearch: debouncedTagSearch,
        limit: 100,
      });

      if (!mounted) return;

      if (res.success) {
        setCategories(res.data.categories || []);
        setTags(res.data.tags || []);
      } else {
        toast.error(res.error || "Failed to load categories and tags");
      }
      setLoadingTaxonomies(false);
    };

    const timer = setTimeout(loadMeta, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [debouncedCategorySearch, debouncedTagSearch]);

  const removeFeaturedImage = () => {
    if (!form.featuredImage) return;

    setForm((prev) => ({ ...prev, featuredImage: "" }));
    toast.success("Featured image removed");
  };

  const toggleCategory = (categoryId) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const addTag = (tagId) => {
    setForm((prev) => {
      if (prev.tags.includes(tagId)) return prev;
      return { ...prev, tags: [...prev.tags, tagId] };
    });
  };

  const removeTag = (tagId) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((id) => id !== tagId) }));
  };

  const refreshTaxonomies = async () => {
    const res = await getBlogFormMeta({
      categorySearch: debouncedCategorySearch,
      tagSearch: debouncedTagSearch,
      limit: 100,
    });
    if (res.success) {
      setCategories(res.data.categories || []);
      setTags(res.data.tags || []);
    } else {
      toast.error(res.error || "Failed to refresh categories/tags");
    }
  };

  const handleCreateCategory = async () => {
    const cleanName = newCategoryName.trim();
    if (cleanName.length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }

    const res = await createBlogCategory({ name: cleanName });
    if (!res.success) {
      toast.error(res.error || "Failed to create category");
      return;
    }

    toast.success("Category created");
    setNewCategoryName("");
    await refreshTaxonomies();
  };

  const handleUpdateCategory = async () => {
    const cleanName = editingCategoryName.trim();
    if (!editingCategoryId || cleanName.length < 2) return;

    const res = await updateBlogCategory(editingCategoryId, { name: cleanName });
    if (!res.success) {
      toast.error(res.error || "Failed to update category");
      return;
    }

    toast.success("Category updated");
    setEditingCategoryId("");
    setEditingCategoryName("");
    await refreshTaxonomies();
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category from all blog posts?")) return;
    const res = await deleteBlogCategory(id);
    if (!res.success) {
      toast.error(res.error || "Failed to delete category");
      return;
    }

    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((cid) => cid !== id),
    }));
    toast.success("Category deleted");
    await refreshTaxonomies();
  };

  const handleCreateTag = async () => {
    const names = parseBulkTagNames(newTagName);
    if (!names.length || isCreatingTags) return;

    const invalidName = names.find((name) => name.length < 2 || name.length > 100);
    if (invalidName) {
      toast.error(`Tag “${invalidName}” must be between 2 and 100 characters`);
      return;
    }

    setIsCreatingTags(true);
    const nextTags = [...tags];
    const selectedIds = [];
    const failedNames = [];
    let createdCount = 0;

    for (const name of names) {
      let tag = nextTags.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      if (!tag) {
        const res = await createBlogTag({ name });
        if (!res.success) {
          failedNames.push(name);
          continue;
        }
        tag = res.data;
        if (!nextTags.some((item) => item._id === tag._id)) nextTags.push(tag);
        if (res.created !== false) createdCount += 1;
      }
      selectedIds.push(tag._id);
    }

    setTags(nextTags);
    setForm((current) => ({
      ...current,
      tags: [...new Set([...current.tags, ...selectedIds])],
    }));
    setNewTagName(failedNames.join(", "));
    setIsCreatingTags(false);

    if (selectedIds.length) {
      toast.success(createdCount
        ? `${createdCount} tag${createdCount === 1 ? "" : "s"} created and selected`
        : "Tags selected");
    }
    if (failedNames.length) toast.error(`Could not create: ${failedNames.join(", ")}`);
  };

  const handleUpdateTag = async () => {
    const cleanName = editingTagName.trim();
    if (!editingTagId || cleanName.length < 2) return;

    const res = await updateBlogTag(editingTagId, { name: cleanName });
    if (!res.success) {
      toast.error(res.error || "Failed to update tag");
      return;
    }

    toast.success("Tag updated");
    setEditingTagId("");
    setEditingTagName("");
    await refreshTaxonomies();
  };

  const handleDeleteTag = async (id) => {
    if (!window.confirm("Delete this tag from all blog posts?")) return;
    const res = await deleteBlogTag(id);
    if (!res.success) {
      toast.error(res.error || "Failed to delete tag");
      return;
    }

    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tid) => tid !== id),
    }));
    toast.success("Tag deleted");
    await refreshTaxonomies();
  };

  const validateClient = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.content || form.content.replace(/<[^>]*>/g, "").trim().length === 0) {
      nextErrors.content = "Content is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (targetStatus) => {
    if (savingRef.current) return;
    if (!validateClient()) {
      toast.error("Please fix the required fields");
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    const cleanSeoDescription = cleanQuillHTML(form.seoDescription);
    const cleanSchemaMarkup = cleanQuillHTML(form.schemaMarkup);
    const payload = {
      ...form,
      title: form.title.trim(),
      seoTitle: form.seoTitle.trim(),
      seoDescription: cleanSeoDescription,
      schemaMarkup: cleanSchemaMarkup,
      canonicalUrl: form.canonicalUrl.trim(),
      focusKeywords: form.focusKeywords.trim(),
      status: targetStatus,
      publishDate: form.publishDate || null,
    };

    const actionResult = isEdit
      ? await updateBlog(initialBlog._id, payload)
      : await createBlog(payload);

    savingRef.current = false;
    setIsSaving(false);

    if (!actionResult.success) {
      setErrors((prev) => ({ ...prev, ...(actionResult.fieldErrors || {}) }));
      toast.error(actionResult.error || "Failed to save blog");
      return;
    }

    toast.success(isEdit ? "Blog updated successfully" : "Blog created successfully");
    clearBlogListReturn();
    router.push("/admin/blogs");
    router.refresh();
  };


  return (
    <div className="blog-editor-page space-y-6 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            {isEdit ? "Edit Blog" : "Create Blog"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => { if (consumeBlogListReturn()) router.back(); else router.push("/admin/blogs"); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
        >
          <FaArrowLeft />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="glassmorphism rounded-2xl p-6 shadow-md">
            <label className="block text-sm text-gray-400 mb-2">Blog Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter blog title"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-gold"
            />
            {errors.title && <p className="text-red-400 text-sm mt-2">{errors.title}</p>}
          </div>

          <div className="glassmorphism rounded-2xl p-6 shadow-md">
            <label className="block text-sm text-gray-400 mb-3">Content *</label>
            <div className="quill-editor rounded-xl overflow-hidden">
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                modules={editorModules}
                formats={quillFormats}
                placeholder="Write your blog content..."
              />
            </div>
            {errors.content && <p className="text-red-400 text-sm mt-2">{errors.content}</p>}
          </div>

          <div className="glassmorphism rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaGlobe /> SEO Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, seoTitle: e.target.value }))
                  }
                  placeholder="SEO title (50-60 characters)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-gold"
                />
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>Recommended: 50-60 characters</span>
                  <span>{form.seoTitle.length}/60</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  SEO Description
                </label>
                <div className="quill-editor rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={form.seoDescription}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, seoDescription: value }))
                    }
                    modules={editorModules}
                    formats={quillFormats}
                    placeholder="Meta description (150-160 characters)"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>Recommended: 150-160 characters</span>
                  <span>{countTextCharacters(form.seoDescription)}/160</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Focus Keywords
                </label>
                <input
                  type="text"
                  value={form.focusKeywords}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, focusKeywords: e.target.value }))
                  }
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-gold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate keywords with commas. These will be used for SEO
                  optimization.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <FaCode /> Schema Markup
                </label>
                <div className="quill-editor rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={form.schemaMarkup}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, schemaMarkup: value }))
                    }
                    modules={schemaMarkupModules}
                    formats={schemaMarkupFormats}
                    placeholder={`{
"@context": "https://schema.org/",
"@type": "BlogPosting",
"headline": "Blog title"
}`}
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  JSON-LD structured data for search engines. Use valid JSON format.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <FaLink /> Canonical URL
                </label>
                <input
                  type="url"
                  value={form.canonicalUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, canonicalUrl: e.target.value }))
                  }
                  placeholder="https://example.com/blogs/blog-slug"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-gold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The preferred URL for this blog post to avoid duplicate content.
                </p>
              </div>

            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="glassmorphism rounded-2xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaImage /> Featured Image
            </h3>

            <div className="image-upload-area rounded-xl p-6 text-center cursor-pointer border-2 border-dashed border-gray-700 hover:border-rose-gold transition-colors">
              {form.featuredImage ? (
                <div className="space-y-3">
                  <Image unoptimized width={640} height={360}
                    src={form.featuredImage}
                    alt="Featured preview"
                    className="w-full h-40 object-cover rounded-lg"
                    
                  />
                  <div className="featured-image-actions">
                    <button
                      type="button"
                      onClick={removeFeaturedImage}
                      className="featured-image-action bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => { imageTarget.current = null; setMediaOpen(true); }}
                      className="featured-image-action bg-rose-gold text-white hover:bg-pink-600 transition-colors"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="py-6">
                    <FaImage className="mx-auto text-4xl text-gray-500 mb-3" />
                    <p className="text-gray-400 text-sm mb-2">Main Image</p>
                    <p className="text-gray-500 text-xs mb-4">Upload primary blog image</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { imageTarget.current = null; setMediaOpen(true); }}
                    className="bg-rose-gold text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors inline-flex items-center"
                  >
                    Browse
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="glassmorphism rounded-2xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-3">Categories</h3>
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full mb-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {loadingTaxonomies ? (
                <p className="text-sm text-gray-400">Loading categories...</p>
              ) : (
                categories.map((category) => (
                  <div key={category._id} className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-200 flex-1">
                      <input
                        type="checkbox"
                        checked={form.categories.includes(category._id)}
                        onChange={() => toggleCategory(category._id)}
                      />
                      <span>{category.name}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(category._id);
                        setEditingCategoryName(category.name);
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category._id)}
                      className="text-xs px-2 py-1 rounded bg-red-600/80 hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>

            {editingCategoryId ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleUpdateCategory}
                  className="bg-rose-gold px-3 rounded-lg text-sm"
                >
                  <FaCheck />
                </button>
              </div>
            ) : null}

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="bg-rose-gold px-3 rounded-lg text-sm"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="glassmorphism rounded-2xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FaTags /> Tags
            </h3>

            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full mb-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tag) => (
                <span
                  key={tag._id}
                  className="inline-flex items-center gap-2 text-xs bg-gray-800 border border-gray-700 rounded-full px-3 py-1"
                >
                  {tag.name}
                  <button type="button" onClick={() => removeTag(tag._id)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {tags.map((tag) => (
                <div key={tag._id} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => addTag(tag._id)}
                    className="text-left flex-1 text-sm text-gray-200 hover:text-rose-gold"
                  >
                    {tag.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTagId(tag._id);
                      setEditingTagName(tag.name);
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag._id)}
                    className="text-xs px-2 py-1 rounded bg-red-600/80 hover:bg-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateTag();
                  }
                }}
                placeholder="Add tags separated by commas"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleCreateTag()}
                disabled={!newTagName.trim() || isCreatingTags}
                aria-label="Create and select tags"
                className="bg-rose-gold px-3 rounded-lg text-sm"
              >
                {isCreatingTags ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Separate multiple tags with commas, for example: news, global, world
            </p>

            {editingTagId ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={editingTagName}
                  onChange={(e) => setEditingTagName(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleUpdateTag}
                  className="bg-rose-gold px-3 rounded-lg text-sm"
                >
                  <FaCheck />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {publishPortalTarget && createPortal(
        <div className="blog-workspace">
          <section className="blog-publish-bar" aria-label="Publish Settings">
            <div className="blog-publish-bar-copy">
              <span className="blog-publish-bar-icon"><FaCalendarAlt /></span>
              <div>
                <strong>Publish Settings</strong>
                <small>Save as draft or publish this blog post.</small>
              </div>
            </div>
            <div className="blog-publish-bar-actions">
              <label className="blog-publish-status">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  disabled={isSaving}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <button type="button" disabled={isSaving} onClick={() => handleSubmit(form.status)} className="blog-publish-submit">
                {isSaving ? <><FaSpinner className="animate-spin" /> Saving</> : <><FaSave /> {isEdit ? "Save Changes" : "Create Blog"}</>}
              </button>
            </div>
          </section>
        </div>,
        publishPortalTarget
      )}
            {/* Add custom styles for Quill editor */}
      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        mediaType="image"
        currentUrl={form.featuredImage || ""}
        onSelect={(item) => {
          if (!item?.url) return;
          setMediaOpen(false);
          if (imageTarget.current) {
            const { editor, index } = imageTarget.current;
            editor.insertEmbed(index, "image", item.url, "user");
            editor.setSelection(index + 1);
            imageTarget.current = null;
          } else setForm((prev) => ({ ...prev, featuredImage: item.url }));
        }}
      />
      <style>{`
        .quill-editor .ql-toolbar {
          background-color: #374151 !important; /* gray-700 */
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: #4b5563 !important; /* gray-600 */
        }

        .quill-editor .ql-container {
          background-color: #1f2937 !important; /* gray-800 */
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #4b5563 !important; /* gray-600 */
          min-height: 120px;
        }

        .quill-editor .ql-editor {
          color: white;
          font-family: inherit;
          min-height: 120px;
        }

        .quill-editor .ql-editor.ql-blank::before {
          color: #9ca3af !important; /* gray-400 */
          font-style: normal;
        }

        .quill-editor .ql-stroke {
          stroke: #d1d5db !important; /* gray-300 */
        }

        .quill-editor .ql-fill {
          fill: #d1d5db !important; /* gray-300 */
        }

        .quill-editor .ql-picker-label {
          color: #d1d5db !important; /* gray-300 */
        }

        .quill-editor .ql-picker-options {
          background-color: #374151 !important; /* gray-700 */
          border-color: #4b5563 !important; /* gray-600 */
        }

        .quill-editor .ql-snow.ql-toolbar button:hover,
        .quill-editor .ql-snow .ql-toolbar button:hover,
        .quill-editor .ql-snow.ql-toolbar button:focus,
        .quill-editor .ql-snow .ql-toolbar button:focus,
        .quill-editor .ql-snow.ql-toolbar button.ql-active,
        .quill-editor .ql-snow .ql-toolbar button.ql-active,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-label:hover,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-label:hover,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-label.ql-active,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-item:hover,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-item:hover,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
          color: #f472b6 !important; /* rose-gold */
        }

        .quill-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-snow .ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-snow.ql-toolbar button:focus .ql-stroke,
        .quill-editor .ql-snow .ql-toolbar button:focus .ql-stroke,
        .quill-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .quill-editor .ql-snow .ql-toolbar button.ql-active .ql-stroke,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .quill-editor
          .ql-snow
          .ql-toolbar
          .ql-picker-label.ql-active
          .ql-stroke,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,
        .quill-editor
          .ql-snow.ql-toolbar
          .ql-picker-item.ql-selected
          .ql-stroke,
        .quill-editor
          .ql-snow
          .ql-toolbar
          .ql-picker-item.ql-selected
          .ql-stroke,
        .quill-editor .ql-snow.ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-snow .ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-snow.ql-toolbar button:focus .ql-fill,
        .quill-editor .ql-snow .ql-toolbar button:focus .ql-fill,
        .quill-editor .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .quill-editor .ql-snow .ql-toolbar button.ql-active .ql-fill,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
        .quill-editor .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill,
        .quill-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill,
        .quill-editor
          .ql-snow
          .ql-toolbar
          .ql-picker-item.ql-selected
          .ql-fill {
          stroke: #f472b6 !important; /* rose-gold */
          fill: #f472b6 !important; /* rose-gold */
        }
      `}</style>
    </div>
  );
}
