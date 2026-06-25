import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const VendorShop = () => {
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", address: "" });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/shops/my")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setShop(res.data[0]);
        } else {
          setShop(null);
        }
      })
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  const createShop = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/shops", form);
      setShop(res.data);
      showToast("Shop created! Waiting for admin approval.", "success");
    } catch {
      showToast("Failed to create shop.", "error");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Shop</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your shop profile and settings.</p>
      </div>

      {shop ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <div className="px-6 sm:px-10 pb-8 relative">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center text-4xl -mt-12 mb-4">
                🏪
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{shop.name}</h2>
                  <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                    <span>📍</span> {shop.address}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                    shop.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
                    shop.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}>
                    {shop.status === "APPROVED" ? "🟢 Approved" : 
                     shop.status === "REJECTED" ? "🔴 Rejected" : 
                     "🟡 Pending Approval"}
                  </span>
                  <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">About Shop</h3>
                <p className="text-gray-600 leading-relaxed max-w-2xl">
                  {shop.description || "No description provided."}
                </p>
              </div>

            </div>
          </div>
          
          {shop.status === "PENDING" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
              <span className="text-2xl">⏳</span>
              <div>
                <h4 className="font-semibold text-amber-800">Awaiting Admin Approval</h4>
                <p className="text-amber-700 text-sm mt-1">Your shop will become visible to customers once an admin approves it. You can still add products in the meantime.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-4xl mb-4 block">🏪</span>
              <h2 className="text-xl font-bold text-gray-900">Create Your Shop</h2>
              <p className="text-gray-500 mt-2 text-sm">Tell us a bit about your business to get started.</p>
            </div>
            
            <form onSubmit={createShop} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Grocery Mart"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Description</label>
                <textarea
                  placeholder="What do you sell?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main Street, City"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium transition-colors shadow-sm"
              >
                Create Shop Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorShop;