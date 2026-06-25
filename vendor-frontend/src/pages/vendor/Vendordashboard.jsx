import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

const LOW_STOCK_THRESHOLD = 10;
const RANGE_OPTIONS = [7, 14, 30];

const StatCard = ({ icon, label, value, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const VendorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outOfStock, setOutOfStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    setRevenueLoading(true);
    api.get(`/orders/vendor/revenue?days=${range}`)
      .then((res) => setRevenueData(res.data))
      .catch(() => setRevenueData([]))
      .finally(() => setRevenueLoading(false));
  }, [range]);

  useEffect(() => {
    api.get("/orders/vendor/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));

    api.get("/shops/my")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          return api.get(`/products/shop/${res.data[0].id}`);
        }
        return null;
      })
      .then((res) => {
        if (!res) return;
        setOutOfStock(res.data.filter((p) => p.stock === 0));
        setLowStock(res.data.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD));
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState icon="📊" title="Unable to load dashboard" />
      </div>
    );
  }

  const maxQty = Math.max(...data.topProducts.map((p) => p.quantitySold), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
        <h1 className="text-3xl font-bold">👋 Welcome back!</h1>
        <p className="text-indigo-100 mt-2 text-lg">
          Monitor your sales, inventory and orders from one place.
        </p>
        <p className="text-sm text-indigo-100 mt-2 opacity-90">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={`₹${data.totalRevenue.toFixed(2)}`}
          accent="bg-green-100"
        />
        <StatCard
          icon="🛒"
          label="Orders"
          value={data.totalOrders}
          accent="bg-blue-100"
        />
        <StatCard
          icon="📦"
          label="Pending"
          value={data.pendingOrders}
          accent="bg-orange-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/vendor/products"
            className="rounded-xl bg-indigo-50 p-4 hover:bg-indigo-100 transition block text-center sm:text-left"
          >
            <span className="text-2xl">📦</span>
            <p className="font-medium mt-2 text-gray-800">Products</p>
          </Link>
          <Link
            to="/vendor/orders"
            className="rounded-xl bg-green-50 p-4 hover:bg-green-100 transition block text-center sm:text-left"
          >
            <span className="text-2xl">🛒</span>
            <p className="font-medium mt-2 text-gray-800">Orders</p>
          </Link>
          <Link
            to="/vendor/coupons"
            className="rounded-xl bg-yellow-50 p-4 hover:bg-yellow-100 transition block text-center sm:text-left"
          >
            <span className="text-2xl">🎟️</span>
            <p className="font-medium mt-2 text-gray-800">Coupons</p>
          </Link>
          <Link
            to="/vendor/shop"
            className="rounded-xl bg-purple-50 p-4 hover:bg-purple-100 transition block text-center sm:text-left"
          >
            <span className="text-2xl">🏪</span>
            <p className="font-medium mt-2 text-gray-800">Shop</p>
          </Link>
        </div>
      </div>

      {/* Revenue Over Time */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Revenue Over Time</h2>
          <div className="flex gap-1.5">
            {RANGE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                  range === d
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {revenueLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : revenueData.every((d) => d.revenue === 0) ? (
            <EmptyState icon="📉" title="No revenue in this period" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  formatter={(value, name) => [name === "revenue" ? `₹${value}` : value, name === "revenue" ? "Revenue" : "Orders"]}
                  labelFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Inventory Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory Alerts</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {outOfStock.length > 0 && (
              <div>
                <p className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">🚨</span> {outOfStock.length} out of stock
                </p>
                <div className="flex flex-wrap gap-2">
                  {outOfStock.map((p) => (
                    <span
                      className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
                      key={p.id}
                    >
                      {p.name} (0)
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lowStock.length > 0 && (
              <div>
                <p className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> {lowStock.length} running low
                </p>
                <div className="flex flex-wrap gap-2">
                  {lowStock.map((p) => (
                    <span
                      className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
                      key={p.id}
                    >
                      {p.name} ({p.stock})
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2">
              <Link
                to="/vendor/products"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100"
              >
                Manage Inventory <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Products */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Top Products</h2>
      {data.topProducts.length === 0 ? (
        <EmptyState icon="📈" title="No sales yet" subtitle="Your top-selling products will appear here" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topProducts.map((p, idx) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = idx < 3 ? medals[idx] : `Rank #${idx + 1}`;
            return (
              <div key={p.productId} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition shadow-sm">
                <div className="mb-3">
                  <p className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                    {idx < 3 ? <span className="text-2xl drop-shadow-sm">{medal}</span> : <span className="text-sm text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded">#{idx + 1}</span>}
                    {p.productName}
                  </p>
                </div>
                <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1 flex justify-between">
                    <span>Revenue</span> 
                    <span className="font-bold text-gray-900">₹{p.revenue.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-500 flex justify-between">
                    <span>Quantity</span>
                    <span className="font-semibold text-gray-700">{p.quantitySold} sold</span>
                  </p>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${(p.quantitySold / maxQty) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;