import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";

const statusColor = {
  PLACED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const nextStatus = {
  PLACED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const STATUS_FILTERS = ["ALL", "PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  const fetchOrders = () => {
    api.get("/orders/vendor").then((res) => {
      setOrders(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status?status=${status}`);
      showToast(`Order #${orderId} updated to ${status}`, "success");
      fetchOrders();
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    if (String(order.id).includes(term)) return true;
    return order.items.some((item) => item.productName.toLowerCase().includes(term));
  });

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage and fulfill your customer orders.</p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar items-center">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {s === "ALL" ? "All Orders" : s.charAt(0) + s.slice(1).toLowerCase()}
                  {s !== "ALL" && statusCounts[s] ? ` (${statusCounts[s]})` : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState icon="📋" title="No orders found" subtitle="Try adjusting your filters or search term." />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500 mb-0.5">Total</p>
                      <p className="font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' :
                      order.status === 'PROCESSING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      order.status === 'SHIPPED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-6 flex flex-col md:flex-row gap-8">
                  {/* Items List */}
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                              📦
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{item.productName}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Actions */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Info</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Method</span>
                        <span className="text-sm font-medium text-gray-900">
                          {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          order.paymentMethod === "ONLINE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                        }`}>
                          {order.paymentMethod === "ONLINE" ? "PAID" : "UNPAID"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-3 sm:hidden">
                        <span className="text-sm font-medium text-gray-500">Total</span>
                        <span className="text-lg font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      {nextStatus[order.status] && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus[order.status])}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-gray-200"
                        >
                          Mark as {nextStatus[order.status]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOrders;