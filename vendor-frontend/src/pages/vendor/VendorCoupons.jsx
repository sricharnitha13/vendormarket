import { useState } from "react";
import { useEffect } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";

const emptyForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  expiryDate: "",
};

const formatDiscount = (c) =>
  c.discountType === "PERCENTAGE"
    ? `${c.discountValue}% off${c.maxDiscountAmount ? ` · capped at ₹${c.maxDiscountAmount}` : ""}`
    : `₹${c.discountValue} off`;

const isExpired = (c) => c.expiryDate && new Date(c.expiryDate) < new Date();

const VendorCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { showToast } = useToast();

  const fetchCoupons = () => {
    api.get("/coupons/my").then((res) => {
      setCoupons(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      showToast("Coupon code and discount value are required", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/coupons", {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxDiscountAmount:
          form.discountType === "PERCENTAGE" && form.maxDiscountAmount
            ? parseFloat(form.maxDiscountAmount)
            : null,
        expiryDate: form.expiryDate ? `${form.expiryDate}:00` : null,
      });
      showToast("Coupon created", "success");
      setShowModal(false);
      fetchCoupons();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to create coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/coupons/${id}/toggle`);
      fetchCoupons();
    } catch {
      showToast("Failed to update coupon", "error");
    }
  };

  const deleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"? This can't be undone.`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      showToast("Coupon deleted", "success");
      fetchCoupons();
    } catch {
      showToast("Failed to delete coupon", "error");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Discount Coupons</h1>
          <p className="text-gray-500 mt-1 text-sm">Create and manage promotional offers for your shop.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
        >
          + Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-2xl mx-auto mt-12">
          <span className="text-5xl block mb-4">🎟️</span>
          <h3 className="text-xl font-bold text-gray-900">No active coupons</h3>
          <p className="text-gray-500 text-sm mt-2 mb-6">Create discount codes to attract more customers and boost sales.</p>
          <button
            onClick={openModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Create Your First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c) => {
            const expired = isExpired(c);
            return (
              <div key={c.id} className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                {/* Ticket Top Notch */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-r border-gray-200"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-l border-gray-200"></div>
                
                <div className="p-6 border-b border-dashed border-gray-200 relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-lg text-lg tracking-wider border border-indigo-100">
                      🎟️ {c.code}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold ${
                        expired
                          ? "bg-gray-100 text-gray-500"
                          : c.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {expired ? "Expired" : c.active ? "🟢 Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 mb-1">{formatDiscount(c)}</h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {c.minOrderAmount ? `On orders above ₹${c.minOrderAmount}` : "No minimum order"}
                  </p>
                </div>

                <div className="p-5 flex-1 flex flex-col bg-gray-50/50">
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Expires</p>
                    <p className="text-sm font-medium text-gray-900">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : "Never"}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleActive(c.id)}
                      disabled={expired}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                        expired ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" :
                        c.active ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50" : 
                        "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteCoupon(c.id, c.code)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Delete Coupon"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Create New Coupon</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Coupon Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WELCOME20"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 placeholder:normal-case"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Type</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                      Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      placeholder={form.discountType === "PERCENTAGE" ? "20" : "150"}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {form.discountType === "PERCENTAGE" && (
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block flex justify-between">
                        Max Cap (₹) <span className="text-gray-400 font-normal normal-case tracking-normal">Optional</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.maxDiscountAmount}
                        onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                      />
                    </div>
                  )}
                  <div className={form.discountType !== "PERCENTAGE" ? "col-span-2" : ""}>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block flex justify-between">
                      Min Order (₹) <span className="text-gray-400 font-normal normal-case tracking-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                      placeholder="e.g. 1000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block flex justify-between">
                    Expiry Date <span className="text-gray-400 font-normal normal-case tracking-normal">Optional</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white text-gray-700 border border-gray-200 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {saving ? "Saving..." : "Create Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCoupons;