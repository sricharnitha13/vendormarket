import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const statusColor = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const StatCard = ({ title, value, icon, gradient }) => (
  <div className={`rounded-2xl p-6 text-white shadow-lg ${gradient} relative overflow-hidden group`}>
    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-500"></div>
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-white/80 font-medium mb-1">{title}</p>
        <p className="text-4xl font-black">{value}</p>
      </div>
      <div className="text-4xl bg-white/20 p-3 rounded-xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

const AdminPanel = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchShops = () => {
    setLoading(true);
    api.get("/shops/all")
      .then((res) => setShops(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchShops(); }, []);

  const approve = async (id) => {
    await api.put(`/shops/${id}/approve`);
    setMsg("Shop approved ✓");
    fetchShops();
    setTimeout(() => setMsg(""), 3000);
  };

  const reject = async (id) => {
    await api.put(`/shops/${id}/reject`);
    setMsg("Shop rejected");
    fetchShops();
    setTimeout(() => setMsg(""), 3000);
  };

  const stats = {
    total: shops.length,
    pending: shops.filter(s => s.status === "PENDING").length,
    approved: shops.filter(s => s.status === "APPROVED").length,
    rejected: shops.filter(s => s.status === "REJECTED").length,
  };

  const filteredShops = filter === "ALL" ? shops : shops.filter(s => s.status === filter);

  if (loading && shops.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-slide-in">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">Manage platform vendors and approvals</p>
          </div>
          {msg && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-bold border border-green-200 shadow-sm animate-fade-in">
              {msg}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <StatCard title="Total Shops" value={stats.total} icon="🏪" gradient="bg-gradient-to-br from-indigo-600 to-purple-700" />
          <StatCard title="Pending Review" value={stats.pending} icon="⏳" gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
          <StatCard title="Approved" value={stats.approved} icon="✅" gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <StatCard title="Rejected" value={stats.rejected} icon="❌" gradient="bg-gradient-to-br from-rose-500 to-red-600" />
        </div>

        {/* Data Table Section */}
        <div className="glass-panel rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
          
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-100 bg-white/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Vendor Directory</h2>
            
            {/* Filters */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                  }`}
                >
                  {f === "ALL" ? "All Shops" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/30">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <span className="text-4xl block mb-3 opacity-50">📂</span>
                      No shops found in this category
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{shop.name}</p>
                            <p className="text-xs text-gray-500 max-w-[200px] truncate" title={shop.description}>{shop.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{shop.ownerName}</p>
                        <p className="text-xs text-gray-500">ID: {shop.ownerId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                          {shop.category || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${statusColor[shop.status]}`}>
                          {shop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {shop.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() => approve(shop.id)}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-emerald-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => reject(shop.id)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-rose-200"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;