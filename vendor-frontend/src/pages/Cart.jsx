import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [showMockModal, setShowMockModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchCart = () =>
    api
      .get("/cart")
      .then((res) => setCart(res.data))
      .catch(() => {
        setCart({ items: [] });
      });

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (!cart?.items?.length) {
      setAvailableCoupons([]);
      return;
    }
    const shopIds = [...new Set(cart.items.map((i) => i.shopId))];
    api
      .get("/coupons/available", { params: { shopIds: shopIds.join(",") } })
      .then((res) => setAvailableCoupons(res.data))
      .catch(() => setAvailableCoupons([]));
  }, [cart]);

  // Backend DTO field has historically drifted between `cartItemId` and `id` —
  // fall back to whichever is actually present rather than silently calling
  // DELETE /cart/remove/undefined.
  const getItemId = (item) => item.cartItemId ?? item.id;

  const remove = async (item) => {
    const itemId = getItemId(item);
    if (itemId === undefined || itemId === null) {
      showToast("Couldn't remove this item — missing item id", "error");
      return;
    }
    try {
      await api.delete(`/cart/remove/${itemId}`);
      await fetchCart();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to remove item", "error");
    }
  };

  const updateQty = async (item, qty) => {
    if (qty < 1) return;
    const itemId = getItemId(item);
    if (itemId === undefined || itemId === null) return;
    try {
      await api.put(`/cart/update/${itemId}?quantity=${qty}`);
      await fetchCart();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to update quantity", "error");
    }
  };

  const subtotal = cart?.items?.reduce((sum, i) => sum + i.subtotal, 0) || 0;

  const couponPreview = useMemo(() => {
    if (!appliedCoupon || !cart?.items) return null;
    if (!appliedCoupon.active) return { error: "This coupon is no longer active" };
    if (appliedCoupon.expiryDate && new Date(appliedCoupon.expiryDate) < new Date()) {
      return { error: "This coupon has expired" };
    }

    const shopSubtotal = cart.items
      .filter((i) => i.shopId === appliedCoupon.shopId)
      .reduce((sum, i) => sum + i.subtotal, 0);

    if (shopSubtotal <= 0) {
      return { error: `This coupon only applies to items from ${appliedCoupon.shopName}` };
    }
    if (appliedCoupon.minOrderAmount && shopSubtotal < appliedCoupon.minOrderAmount) {
      return {
        error: `Add ₹${(appliedCoupon.minOrderAmount - shopSubtotal).toFixed(2)} more from ${appliedCoupon.shopName} to use this coupon`,
      };
    }

    let discount;
    if (appliedCoupon.discountType === "PERCENTAGE") {
      discount = shopSubtotal * (appliedCoupon.discountValue / 100);
      if (appliedCoupon.maxDiscountAmount) discount = Math.min(discount, appliedCoupon.maxDiscountAmount);
    } else {
      discount = Math.min(appliedCoupon.discountValue, shopSubtotal);
    }
    return { discount };
  }, [appliedCoupon, cart]);

  const discount = couponPreview && !couponPreview.error ? couponPreview.discount : 0;
  const finalTotal = subtotal - discount;

  const applyCouponCode = async (code) => {
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api.get("/coupons/validate", { params: { code } });
      setAppliedCoupon(res.data);
      setCouponInput("");
    } catch (e) {
      setAppliedCoupon(null);
      setCouponError(e?.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const applyCoupon = () => applyCouponCode(couponInput.trim());

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const finalizeOrder = async (method) => {
    setPlacing(true);
    try {
      await api.post("/orders", {
        paymentMethod: method,
        couponCode: appliedCoupon && !couponPreview?.error ? appliedCoupon.code : null,
      });
      showToast("Order placed successfully", "success");
      setAppliedCoupon(null);
      setCouponInput("");
      await fetchCart();
      navigate("/orders");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to place order", "error");
    } finally {
      setPlacing(false);
      setShowMockModal(false);
    }
  };

  const placeOrder = () => {
    if (paymentMethod === "COD") {
      finalizeOrder("COD");
    } else {
      setShowMockModal(true);
    }
  };

  if (!cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Shopping Cart</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {cart.items?.length || 0} item{(cart.items?.length || 0) === 1 ? "" : "s"} in your cart
        </p>
      </div>

      {cart.items?.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center max-w-3xl mx-auto mt-12">
          <span className="text-6xl block mb-6">🛒</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet. Discover great products from local stores!</p>
          <button
            onClick={() => navigate("/products")}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 hidden sm:flex text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="flex-1">Product Details</div>
                <div className="w-32 text-center">Quantity</div>
                <div className="w-24 text-right">Total</div>
              </div>

              <div className="divide-y divide-gray-50">
                {cart.items.map((item) => (
                  <div key={getItemId(item)} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-3xl">
                      📦
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{item.productName}</h3>
                      <p className="text-sm font-medium text-indigo-600 mt-1">₹{item.price}</p>

                      {/* Mobile controls (visible only on small screens) */}
                      <div className="mt-4 sm:hidden flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                          <button onClick={() => updateQty(item, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 font-bold">−</button>
                          <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQty(item, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 font-bold">+</button>
                        </div>
                        <button onClick={() => remove(item)} className="text-sm font-semibold text-red-500 hover:text-red-700">Remove</button>
                      </div>
                    </div>

                    {/* Desktop controls */}
                    <div className="hidden sm:flex flex-col items-center gap-3 w-32">
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <button onClick={() => updateQty(item, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 font-bold transition-colors">−</button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateQty(item, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-indigo-600 font-bold transition-colors">+</button>
                      </div>
                      <button onClick={() => remove(item)} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Remove
                      </button>
                    </div>

                    <div className="hidden sm:block w-24 text-right">
                      <p className="font-bold text-gray-900 text-lg">₹{item.subtotal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Checkout */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">

            {/* Coupons Module */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏷️</span> Apply Promotions
              </h3>

              {!appliedCoupon && availableCoupons.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Coupons</p>
                  <div className="flex flex-wrap gap-2">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => applyCouponCode(c.code)}
                        className="group relative overflow-hidden border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/50 text-left px-3 py-2 rounded-xl transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono font-bold text-indigo-700 text-sm tracking-wide">{c.code}</span>
                          <span className="text-xs font-medium text-indigo-600 bg-white px-2 py-0.5 rounded-md shadow-sm">
                            {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <p className="font-mono font-bold text-green-800 tracking-wide">{appliedCoupon.code}</p>
                    </div>
                    <p className="text-xs text-green-700 mt-1 font-medium">
                      {appliedCoupon.discountType === "PERCENTAGE"
                        ? `${appliedCoupon.discountValue}% off at ${appliedCoupon.shopName}`
                        : `₹${appliedCoupon.discountValue} off at ${appliedCoupon.shopName}`}
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Remove coupon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              )}

              {couponError && <p className="text-xs font-medium text-red-500 mt-3 flex items-center gap-1"><span>⚠️</span> {couponError}</p>}
              {appliedCoupon && couponPreview?.error && (
                <p className="text-xs font-medium text-amber-600 mt-3 flex items-center gap-1"><span>⚠️</span> {couponPreview.error}</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium bg-green-50/50 p-2 -mx-2 rounded-lg">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>−₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-indigo-600">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Method</p>
                <div className="space-y-3">
                  <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                      <input
                        type="radio"
                        name="payment"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-indigo-600 transition-colors"></div>
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className={`font-semibold text-sm ${paymentMethod === 'COD' ? 'text-indigo-900' : 'text-gray-700'}`}>Cash on Delivery</span>
                  </label>

                  <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                      <input
                        type="radio"
                        name="payment"
                        value="ONLINE"
                        checked={paymentMethod === "ONLINE"}
                        onChange={() => setPaymentMethod("ONLINE")}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-indigo-600 transition-colors"></div>
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className={`font-semibold text-sm ${paymentMethod === 'ONLINE' ? 'text-indigo-900' : 'text-gray-700'}`}>Pay Online Now</span>
                  </label>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || (appliedCoupon && !!couponPreview?.error)}
                className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {placing ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Modal */}
      {showMockModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>💳</span> Secure Payment
              </h2>
              <button onClick={() => setShowMockModal(false)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full p-1.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center mb-6">
                <p className="text-sm font-semibold text-indigo-600 mb-1">Amount to Pay</p>
                <p className="text-4xl font-black text-indigo-900">₹{finalTotal.toFixed(2)}</p>
                {discount > 0 && (
                  <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-100/50 inline-block px-2 py-1 rounded-md">
                    Includes ₹{discount.toFixed(2)} discount
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                      defaultValue="4111 1111 1111 1111"
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Expiry Date</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                      defaultValue="12/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">CVV</label>
                    <input
                      type="password"
                      maxLength="3"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                      defaultValue="123"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => finalizeOrder("ONLINE")}
                disabled={placing}
                className="w-full mt-8 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-gray-800 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                {placing ? "Processing..." : `Pay ₹${finalTotal.toFixed(2)}`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
                This is a mock payment simulation
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;