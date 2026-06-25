import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";

const LOW_STOCK_THRESHOLD = 10;

const VendorProducts = () => {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/shops/my")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const myShop = res.data[0];
          setShop(myShop);
          return api.get(`/products/shop/${myShop.id}`);
        }
        return null;
      })
      .then((res) => {
        if (res) setProducts(res.data);
      })
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shop || !shop.id) {
      showToast("Shop not loaded yet. Please refresh.", "error");
      return;
    }
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        imageUrl: form.imageUrl,
        shopId: shop.id,
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showToast("Product updated ✓", "success");
      } else {
        await api.post("/products", payload);
        showToast("Product added ✓", "success");
      }
      setForm({ name: "", description: "", price: "", stock: "", imageUrl: "" });
      setEditingId(null);
      const res = await api.get(`/products/shop/${shop.id}`);
      setProducts(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save product.", "error");
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl || "",
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      showToast("Product deleted", "success");
    } catch {
      showToast("Failed to delete product", "error");
    }
  };

  const downloadTemplate = () => {
    const csv = "name,description,price,stock,imageUrl\nSample Product,A great product,99.99,50,https://example.com/image.jpg\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !shop) return;

    setBulkUploading(true);
    setBulkResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map((row) => ({
          name: (row.name || "").trim(),
          description: (row.description || "").trim(),
          price: row.price !== undefined && row.price !== "" ? Number(row.price) : null,
          stock: row.stock !== undefined && row.stock !== "" ? Number(row.stock) : null,
          imageUrl: (row.imageUrl || "").trim(),
          shopId: shop.id,
        }));

        if (rows.length === 0) {
          showToast("CSV file is empty", "error");
          setBulkUploading(false);
          return;
        }

        try {
          const res = await api.post("/products/bulk", rows);
          setBulkResult(res.data);
          if (res.data.successCount > 0) {
            const productsRes = await api.get(`/products/shop/${shop.id}`);
            setProducts(productsRes.data);
          }
          showToast(
            `Imported ${res.data.successCount}/${res.data.totalRows} products`,
            res.data.errors.length > 0 ? "error" : "success"
          );
        } catch {
          showToast("Bulk upload failed", "error");
        }
        setBulkUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: () => {
        showToast("Failed to parse CSV file", "error");
        setBulkUploading(false);
      },
    });
  };

  if (loading) return <Spinner />;

  if (!shop)
    return (
      <div className="max-w-2xl mx-auto p-6">
        <EmptyState
          icon="🏪"
          title="You need to create a shop first"
          subtitle="Go to the My Shop tab to get started"
        />
      </div>
    );

  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage inventory for <span className="font-semibold text-indigo-600">{shop.name}</span></p>
        </div>
        {!editingId && (
          <button 
            onClick={() => {
              const el = document.getElementById('product-form');
              if(el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Inventory Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {outOfStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <span className="text-xl">🔴</span>
              <div>
                <p className="font-bold text-red-800 text-sm">{outOfStock.length} Product{outOfStock.length === 1 ? "" : "s"} Out of Stock</p>
                <p className="text-red-600 mt-1 text-xs">{outOfStock.map((p) => p.name).join(", ")}</p>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-xl">🟡</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">{lowStock.length} Product{lowStock.length === 1 ? "" : "s"} Low on Stock</p>
                <p className="text-amber-600 mt-1 text-xs">{lowStock.map((p) => `${p.name} (${p.stock})`).join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content: Product List */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <span className="text-4xl block mb-4">📦</span>
              <h3 className="text-lg font-bold text-gray-900">No products yet</h3>
              <p className="text-gray-500 text-sm mt-1">Start by adding your first product using the form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => {
                const isOut = p.stock === 0;
                const isLow = p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                    <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-4xl text-gray-300">📦</span>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {isOut && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">OUT OF STOCK</span>}
                        {isLow && <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">LOW STOCK</span>}
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{p.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description || "No description"}</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{p.price}</p>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                          Stock: {p.stock}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(p)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(p.id)} className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Add/Edit Form & Bulk Upload */}
        <div className="lg:col-span-1 order-1 lg:order-2 space-y-6" id="product-form">
          {/* Add / Edit Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              {editingId ? <><span>✏️</span> Edit Product</> : <><span>✨</span> Add New Product</>}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Tomatoes"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Brief details about the product..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
                >
                  {editingId ? "Save Changes" : "Add Product"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm({ name: "", description: "", price: "", stock: "", imageUrl: "" });
                    }}
                    className="px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Bulk Import</h3>
                <button onClick={downloadTemplate} className="text-xs text-indigo-600 hover:underline font-medium">
                  Template CSV
                </button>
              </div>
              <label className="block w-full cursor-pointer group">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                  <span className="block text-xl mb-1">📁</span>
                  <span className="text-xs font-medium text-gray-600 block group-hover:text-indigo-600">
                    {bulkUploading ? "Uploading..." : "Click to upload CSV"}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={bulkUploading}
                  className="hidden"
                />
              </label>

              {bulkResult && !bulkUploading && (
                <div className="mt-4">
                  <div className={`text-xs p-3 rounded-lg border ${
                    bulkResult.errors.length === 0
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-amber-50 border-amber-100 text-amber-700"
                  }`}>
                    <strong>✓ {bulkResult.successCount} imported</strong>
                    {bulkResult.errors.length > 0 && (
                      <div className="mt-2 text-red-600">
                        <p>{bulkResult.errors.length} skipped:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          {bulkResult.errors.slice(0, 3).map((err, i) => <li key={i}>{err}</li>)}
                          {bulkResult.errors.length > 3 && <li>...and more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProducts;