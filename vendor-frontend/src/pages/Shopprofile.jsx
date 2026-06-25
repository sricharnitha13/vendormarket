import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const ProductCard = ({ p, addToCart, onView }) => (
  <div
    onClick={() => onView(p)}
    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative"
  >
    <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
      {p.imageUrl ? (
        <img
          src={p.imageUrl}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
        />
      ) : (
        <span className="text-5xl opacity-30 group-hover:scale-110 transition-transform duration-500 ease-in-out">📦</span>
      )}
      
      {/* Overlay gradient for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {typeof p.stock === "number" && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {p.stock <= 0 && (
            <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
              Out of stock
            </span>
          )}
          {p.stock > 0 && p.stock <= 5 && (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
              Only {p.stock} left
            </span>
          )}
        </div>
      )}
    </div>

    <div className="p-5 flex flex-col justify-between flex-1 gap-4 bg-white z-10">
      <div>
        <h3 className="font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{p.description || "No description available"}</p>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
        <div>
          <p className="text-indigo-600 font-black text-lg">₹{p.price}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); addToCart(p.id); }}
          disabled={p.stock === 0}
          className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-indigo-600 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow group-hover:flex"
          title="Add to Cart"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </button>
      </div>
    </div>
  </div>
);

const ShopProfile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVendorInfo, setShowVendorInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`api/shops/${id}`),
      api.get(`api/products/shop/${id}`),
      api.get(`api/coupons/available`, { params: { shopIds: id } }).catch(() => ({ data: [] }))
    ])
      .then(([shopRes, productsRes, couponsRes]) => {
        setShop(shopRes.data);
        const unique = productsRes.data.filter(
          (p, index, self) => self.findIndex((x) => x.id === p.id) === index
        );
        setProducts(unique);
        setCoupons(couponsRes.data);
      })
      .catch(() => showToast("Failed to load shop", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addToCart = async (productId) => {
    if (!user) {
      showToast("Please log in as a Customer to add products to your cart", "info");
      navigate("/login");
      return;
    }
    try {
      await api.post("/cart/add", { productId, quantity: 1 });
      showToast("Added to cart ✓", "success");
    } catch {
      showToast("Login as Customer to add to cart", "error");
    }
  };

  const handleViewProduct = (product) => {
    navigate(`/products/${product.id}?from=${id}`);
  };

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon ${code} copied to clipboard!`, "success");
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        Shop not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-6 inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow"
      >
        ← Back
      </button>

      {/* Shop Header (Premium Storefront Banner) */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12 relative">
        <div className="h-40 sm:h-56 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-5xl sm:text-6xl flex-shrink-0">
              🏬
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{shop.name}</h1>
                {shop.category && (
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100">
                    {shop.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                {shop.address && <p className="flex items-center gap-1">📍 {shop.address}</p>}
                <p className="flex items-center gap-1">📦 {products.length} Products</p>
              </div>
            </div>
            <div className="pb-2 hidden md:block">
               <button
                  onClick={() => setShowVendorInfo(true)}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
                >
                  ℹ️ Store Info
                </button>
            </div>
          </div>

          <div className="max-w-3xl">
            {shop.description ? (
              <p className="text-gray-600 leading-relaxed text-lg">{shop.description}</p>
            ) : (
              <p className="text-gray-400 italic">Welcome to {shop.name}!</p>
            )}
          </div>
          
          <div className="mt-6 md:hidden">
            <button
              onClick={() => setShowVendorInfo(true)}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm inline-flex items-center gap-2"
            >
              ℹ️ Store Info
            </button>
          </div>
        </div>
      </div>

      {/* Available Coupons Section */}
      {coupons.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Store Offers</h2>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Save</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="relative bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow group flex items-center justify-between overflow-hidden">
                {/* Decorative cutouts */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-r border-indigo-100"></div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-l border-indigo-100"></div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Use Code</p>
                  <p className="text-2xl font-black text-indigo-700 font-mono tracking-wide">{c.code}</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    {c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => copyCoupon(c.code)}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                  title="Copy code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendor Details Modal */}
      {showVendorInfo && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowVendorInfo(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Store Information</h3>
              <button
                onClick={() => setShowVendorInfo(false)}
                className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-700">
              {shop.ownerName && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner</p>
                    <p className="font-semibold text-gray-900">{shop.ownerName}</p>
                  </div>
                </div>
              )}
              {shop.address && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="font-medium text-gray-800">{shop.address}</p>
                  </div>
                </div>
              )}
              {shop.ownerEmail && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg">📧</span>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Email</p>
                    <p className="font-medium text-gray-800">{shop.ownerEmail}</p>
                  </div>
                </div>
              )}
              {shop.ownerPhone && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg">📞</span>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                    <p className="font-medium text-gray-800">{shop.ownerPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h2>
        
        {/* Search within shop */}
        {products.length > 0 && (
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input
              type="text"
              placeholder={`Search in ${shop.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:font-normal"
            />
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-3">📭</span>
          <h3 className="text-lg font-bold text-gray-900">No products yet</h3>
          <p className="text-gray-500 text-sm mt-1">This store hasn't added any products.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-3">🔍</span>
          <h3 className="text-lg font-bold text-gray-900">No products found</h3>
          <p className="text-gray-500 text-sm mt-1">We couldn't find anything matching your search in this store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} p={p} addToCart={addToCart} onView={handleViewProduct} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopProfile;