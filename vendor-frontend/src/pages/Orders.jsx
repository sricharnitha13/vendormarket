import { useEffect, useState } from "react";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";

const statusColor = {
  PLACED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-amber-50 text-amber-700 border-amber-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const TRACK_STEPS = [
  { key: "PLACED", label: "Order Placed", icon: "🧾" },
  { key: "PROCESSING", label: "Processing", icon: "📦" },
  { key: "SHIPPED", label: "Shipped", icon: "🚚" },
  { key: "DELIVERED", label: "Delivered", icon: "✨" },
];

const OrderTracker = ({ status }) => {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 mt-6 bg-red-50/50 border border-red-100 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">✕</div>
        <div>
          <p className="text-sm font-bold text-red-800">Order Cancelled</p>
          <p className="text-xs text-red-600/80 mt-0.5">This order was cancelled and will not be delivered.</p>
        </div>
      </div>
    );
  }

  const currentIndex = TRACK_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="mt-8 mb-4 relative">
      <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full -z-10"></div>
      
      {currentIndex >= 0 && (
        <div 
          className="absolute top-5 left-0 h-1 bg-indigo-500 rounded-full -z-10 transition-all duration-1000 ease-in-out"
          style={{ width: `${(currentIndex / (TRACK_STEPS.length - 1)) * 100}%` }}
        ></div>
      )}

      <div className="flex items-center justify-between">
        {TRACK_STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center relative group">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm
                  ${isCurrent ? "bg-indigo-600 text-white scale-110 ring-4 ring-indigo-100" : 
                    isDone ? "bg-indigo-600 text-white" : "bg-white text-gray-300 border-2 border-gray-100"
                  }`}
              >
                {step.icon}
              </div>
              <p className={`text-[11px] mt-3 font-bold text-center absolute top-10 w-24 -ml-12 left-1/2 uppercase tracking-wider transition-colors duration-500
                ${isCurrent ? "text-indigo-700" : isDone ? "text-gray-800" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchOrders = () => {
    setLoading(true);
    api.get("/orders").then((res) => {
      // sort orders by ID descending (newest first)
      const sorted = res.data.sort((a, b) => b.id - a.id);
      setOrders(sorted);
      setLoading(false);
    });
  };

  useEffect(() => { fetchOrders(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      showToast("Order cancelled successfully", "success");
      fetchOrders();
    } catch {
      showToast("Failed to cancel order", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Order History</h1>
        <p className="text-gray-500 mt-1 text-sm">Track, manage and view your recent purchases.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center max-w-2xl mx-auto mt-12">
          <span className="text-6xl block mb-6">📦</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">When you place an order, its tracking details will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Order Header */}
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</p>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount</p>
                    <p className="font-bold text-indigo-600 mt-0.5">₹{order.totalAmount}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5 flex items-center gap-1.5">
                      {order.paymentMethod === "COD" ? "💵 Cash on Delivery" : "💳 Paid Online"}
                      {order.paymentMethod === "ONLINE" && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Paid successfully"></span>}
                    </p>
                  </div>
                </div>
                
                <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider border ${statusColor[order.status]}`}>
                  {order.status}
                </span>
              </div>

              {/* Order Body */}
              <div className="p-6">
                
                {/* Items List */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    Items in this order
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors bg-white">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-xl border border-gray-100 flex-shrink-0">
                          📦
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-gray-500 mt-1 font-medium">Qty: {item.quantity} × ₹{(item.subtotal / item.quantity).toFixed(2)}</p>
                          <p className="text-sm font-bold text-indigo-600 mt-1">₹{item.subtotal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracker */}
                <div className="px-4 pb-4">
                  <OrderTracker status={order.status} />
                </div>

                {/* Actions */}
                {(order.status === "PLACED" || order.status === "PROCESSING") && (
                  <div className="mt-8 pt-4 border-t border-gray-50 flex justify-end">
                    <button
                      onClick={() => cancel(order.id)}
                      className="text-sm font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-5 py-2 rounded-lg transition-colors border border-red-100 hover:border-red-600"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;