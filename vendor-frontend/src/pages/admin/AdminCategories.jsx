import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const IconSearch = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="9" cy="9" r="6" />
    <path d="M17 17l-4-4" strokeLinecap="round" />
  </svg>
);
const IconPlus = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
  </svg>
);
const IconPencil = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path
      d="M13.5 3.5l3 3L7 16l-3.5.5L4 13l9.5-9.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconTrash = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M4 6h12M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m-6.5 0l.6 9.4A1.5 1.5 0 007.6 17h4.8a1.5 1.5 0 001.5-1.6L14.5 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconFolder = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3 5.5A1.5 1.5 0 014.5 4h3.4a1.5 1.5 0 011.2.6l.8 1.07a1.5 1.5 0 001.2.6H15.5A1.5 1.5 0 0117 7.77V14.5A1.5 1.5 0 0115.5 16h-11A1.5 1.5 0 013 14.5v-9z" />
  </svg>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  const styles = toast.type === "error" ? "bg-rose-600 text-white" : "bg-gray-900 text-white";
  return (
    <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${styles}`}>
      {toast.message}
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Create/edit modal. null = closed, {} = creating, category object = editing.
  const [formTarget, setFormTarget] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/categories", { params });
      setCategories(res.data);
    } catch {
      notify("error", "Couldn't load categories. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCategories, 300);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  const openCreate = () => {
    setFormTarget({});
    setFormName("");
    setFormDescription("");
    setFormError("");
  };

  const openEdit = (category) => {
    setFormTarget(category);
    setFormName(category.name || "");
    setFormDescription(category.description || "");
    setFormError("");
  };

  const closeForm = () => {
    if (saving) return;
    setFormTarget(null);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      setFormError("Category name is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const isEdit = Boolean(formTarget?.id);
    try {
      const payload = { name, description: formDescription.trim() };
      if (isEdit) {
        await api.put(`/categories/${formTarget.id}`, payload);
        notify("success", `${name} updated`);
      } else {
        await api.post("/categories", payload);
        notify("success", `${name} created`);
      }
      setFormTarget(null);
      fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || `Couldn't ${isEdit ? "update" : "create"} this category.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      notify("success", `${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      notify("error", err.response?.data?.message || "Couldn't delete this category.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toast toast={toast} />

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <IconPlus className="w-4 h-4" />
          New category
        </button>
      </div>

      <div className="relative mb-5">
        <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories"
          className="w-full sm:max-w-sm pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading categories…</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <IconFolder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">
              {search.trim() ? "No categories match this search" : "No categories yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {search.trim() ? "Try a different search term." : "Create your first category to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Created {formatDate(category.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(category)}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    <IconPencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(category)}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-rose-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-50"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {formTarget.id ? `Edit ${formTarget.name}` : "New category"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formTarget.id
                ? "Update the name or description shown to vendors and customers."
                : "Vendors will be able to assign products to this category."}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Home & Kitchen"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="A short description shown to help vendors pick the right category"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              {formError && <p className="text-sm text-rose-600">{formError}</p>}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : formTarget.id ? "Save changes" : "Create category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900">Delete {deleteTarget.name}?</h2>
            <p className="text-sm text-gray-500 mt-2">
              This can't be undone. If any products are already assigned to this category, check with
              vendors before removing it so listings don't end up uncategorized.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;