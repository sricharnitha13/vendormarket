import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const GREETING = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm your VendorMarket shopping assistant 👋 I can help you find products, check on an order, or add something to your cart. What can I help with?",
};

const IconChat = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconClose = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconSend = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ORDER_STATUS_STYLES = {
  PLACED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-yellow-50 text-yellow-700",
  SHIPPED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const ProductCardMini = ({ product, onAddToCart, onView }) => (
  <div className="w-40 shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
    <button onClick={() => onView(product)} className="block w-full text-left">
      <div className="h-24 bg-gray-50 flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl opacity-30">📦</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{product.name}</p>
        <p className="text-xs font-bold text-indigo-600 mt-0.5">₹{product.price}</p>
      </div>
    </button>
    <button
      onClick={() => onAddToCart(product)}
      disabled={product.stock === 0}
      className="w-full text-xs font-semibold text-white bg-gray-900 hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 py-1.5 transition-colors"
    >
      {product.stock === 0 ? "Out of stock" : "Add to Cart"}
    </button>
  </div>
);

const OrderCardMini = ({ order, onView }) => (
  <button
    onClick={onView}
    className="w-full text-left bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:border-gray-200 transition-colors"
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-900">Order #{order.id}</p>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"}`}>
        {order.status}
      </span>
    </div>
    <p className="text-xs text-gray-500 mt-1">₹{order.totalAmount?.toFixed?.(2) ?? order.totalAmount}</p>
  </button>
);

const ShopCardMini = ({ shop, onView }) => (
  <button
    onClick={() => onView(shop)}
    className="w-40 shrink-0 text-left bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:border-gray-200 transition-colors"
  >
    <div className="h-16 bg-gray-50 flex items-center justify-center text-2xl">🏬</div>
    <div className="p-2.5">
      <p className="text-xs font-semibold text-gray-900 line-clamp-1">{shop.name}</p>
      {shop.category && <p className="text-[10px] text-indigo-600 font-medium mt-0.5">{shop.category}</p>}
    </div>
  </button>
);

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const handleAddToCart = async (product) => {
    try {
      await api.post("/cart/add", { productId: product.id, quantity: 1 });
      showToast(`Added ${product.name} to cart ✓`, "success");
    } catch {
      showToast("Login as Customer to add to cart", "error");
    }
  };

  const handleViewProduct = (product) => {
    setOpen(false);
    navigate(`/products/${product.id}`);
  };

  const handleViewOrders = () => {
    setOpen(false);
    navigate("/orders");
  };

  const handleViewShop = (shop) => {
    setOpen(false);
    navigate(`/shops/${shop.id}`);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { id: Date.now(), role: "user", content: text };
    const history = messages
      .filter((m) => m.id !== "greeting")
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: text, history });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: res.data.reply,
          products: res.data.products,
          orders: res.data.orders,
          shops: res.data.shops,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: "Sorry, I'm having trouble right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[92vw] h-[520px] max-h-[72vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
            <div>
              <p className="text-sm font-semibold">Shopping Assistant</p>
              <p className="text-[11px] text-gray-300">Ask me to find, track, or add to cart</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                  <div
                    className={`text-sm px-3.5 py-2.5 rounded-2xl ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.products && m.products.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-2 pb-1 -mx-1 px-1">
                      {m.products.map((p) => (
                        <ProductCardMini key={p.id} product={p} onAddToCart={handleAddToCart} onView={handleViewProduct} />
                      ))}
                    </div>
                  )}

                  {m.orders && m.orders.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {m.orders.map((o) => (
                        <OrderCardMini key={o.id} order={o} onView={handleViewOrders} />
                      ))}
                    </div>
                  )}

                  {m.shops && m.shops.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-2 pb-1 -mx-1 px-1">
                      {m.shops.map((s) => (
                        <ShopCardMini key={s.id} shop={s} onView={handleViewShop} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 max-h-24"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="shrink-0 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IconSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Open shopping assistant"
      >
        {open ? <IconClose className="w-6 h-6" /> : <IconChat className="w-6 h-6" />}
      </button>
    </>
  );
};

export default ChatWidget;