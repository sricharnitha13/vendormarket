import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const ProductCard = ({ p, addToCart, buyNow, onView, isWishlisted, onToggleWishlist }) => (
  <div
    onClick={() => onView && onView(p)}
    className="group glass-panel rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative"
  >
    <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
      {p.imageUrl ? (
        <img
          src={p.imageUrl}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
      ) : (
        <span className="text-5xl opacity-30 group-hover:scale-110 transition-transform duration-500 ease-in-out">📦</span>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {onToggleWishlist && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(p); }}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-white/95 backdrop-blur shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span className={`text-xl leading-none ${isWishlisted ? "text-red-500" : "text-gray-300"}`}>
            {isWishlisted ? "♥" : "♡"}
          </span>
        </button>
      )}

      {typeof p.stock === "number" && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-20">
          {p.stock <= 0 && (
            <span className="bg-red-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
              Out of stock
            </span>
          )}
          {p.stock > 0 && p.stock <= 5 && (
            <span className="bg-amber-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
              Only {p.stock} left
            </span>
          )}
        </div>
      )}
    </div>

    <div className="p-5 flex flex-col justify-between flex-1 gap-4 bg-white/50 z-10">
      <div>
        <h3 className="font-extrabold text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{p.description || "No description available"}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/60 gap-2">
        <p className="text-indigo-600 font-black text-xl shrink-0 tracking-tight">₹{p.price}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); buyNow(p.id); }}
            disabled={p.stock === 0}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow hover:shadow-md whitespace-nowrap"
          >
            Buy Now
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(p.id); }}
            disabled={p.stock === 0}
            className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-gray-800 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow hover:shadow-md"
            title="Add to Cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Products = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [forYou, setForYou] = useState([]);
  const [forYouLabel, setForYouLabel] = useState("✨ Recommended for You");
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/shops").then((res) => {
      const unique = res.data.filter(
        (shop, index, self) => self.findIndex((s) => s.id === shop.id) === index
      );
      setShops(unique);
      setLoadingShops(false);
    }).catch(() => {
      setLoadingShops(false);
    });

    if (user) {
      api.get("/api/wishlist")
        .then((res) => setWishlistIds(new Set(res.data.map((w) => w.productId))))
        .catch(() => {});
    }

    api.get("/ai/recommendations/for-you")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setForYou(res.data);
          setForYouLabel("✨ Recommended for You");
        } else {
          api.get("/api/products/search").then((r) => {
            setForYou(r.data.slice(0, 8));
            setForYouLabel("You might also like");
          }).catch(() => {});
        }
      })
      .catch(() => {
        api.get("/api/products/search").then((r) => {
          setForYou(r.data.slice(0, 8));
          setForYouLabel("Trending Products");
        }).catch(() => {});
      });
  }, [user]);

  const handleToggleWishlist = async (product) => {
    if (!user) {
      showToast("Please log in as a Customer to manage your wishlist", "info");
      navigate("/login");
      return;
    }
    const isWishlisted = wishlistIds.has(product.id);
    try {
      if (isWishlisted) {
        await api.delete(`/api/wishlist/remove/${product.id}`);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        showToast("Removed from wishlist", "success");
      } else {
        await api.post(`/api/wishlist/add/${product.id}`);
        setWishlistIds((prev) => new Set(prev).add(product.id));
        showToast("Added to wishlist ♥", "success");
      }
    } catch {
      showToast("Login as Customer to use wishlist", "error");
    }
  };

  const handleViewProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setLastQuery(searchTerm);
    try {
      if (aiMode) {
        const res = await api.post("/ai/search", { query: searchTerm });
        setSearchResults(res.data);
      } else {
        const res = await api.get(`/api/products/search?keyword=${encodeURIComponent(searchTerm)}`);
        setSearchResults(res.data);
      }
    } catch {
      showToast("Search failed, try again", "error");
      setSearchResults([]);
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults(null);
    setLastQuery("");
  };

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

  const buyNow = async (productId) => {
    if (!user) {
      showToast("Please log in as a Customer to purchase items", "info");
      navigate("/login");
      return;
    }
    try {
      await api.post("/cart/add", { productId, quantity: 1 });
      navigate("/cart");
    } catch {
      showToast("Login as Customer to buy this item", "error");
    }
  };

  const categories = ["All", ...new Set(shops.map(s => s.category).filter(Boolean))];
  const filteredShops = activeCategory === "All" ? shops : shops.filter(s => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Search Header Banner */}
      <div className="bg-[#0B0F19] py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] translate-y-1/2 translate-x-1/4 mix-blend-screen pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center animate-slide-in">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Find exactly what <br className="hidden sm:block" /> you're looking for.
          </h1>
          <p className="text-indigo-200/80 text-lg sm:text-xl mb-10 max-w-2xl mx-auto font-medium">
            Discover premium products from hundreds of verified local stores.
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto glass-panel-dark p-2 sm:p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 sm:gap-3 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-5 text-indigo-400 text-xl flex items-center justify-center h-full pointer-events-none">
                {aiMode ? "✨" : "🔍"}
              </span>
              <input
                type="text"
                placeholder={aiMode ? 'Try "running shoes under 2000"...' : "Search for anything..."}
                className="w-full bg-transparent border-none pl-14 pr-4 py-3 sm:py-4 text-base sm:text-lg text-white focus:outline-none focus:ring-0 placeholder:text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 sm:w-auto w-full px-2 sm:px-0 pb-2 sm:pb-0">
              {searchResults && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex-1 sm:flex-none bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-6 flex justify-center">
            <label className="inline-flex items-center gap-3 cursor-pointer group glass-panel-dark hover:bg-white/10 px-5 py-2.5 rounded-full transition-all">
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors border border-white/20">
                <input
                  type="checkbox"
                  checked={aiMode}
                  onChange={(e) => setAiMode(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-black/50 peer-checked:bg-indigo-500 transition-colors"></div>
                <div className="absolute left-[2px] top-[1px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-full"></div>
              </div>
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors tracking-wide">
                Use AI Semantic Search
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {searchResults !== null ? (
          /* Search Results */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Search Results</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-gray-600 font-bold bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm shadow-sm">
                    {searchResults.length} items found
                  </span>
                  {aiMode && lastQuery && (
                    <span className="bg-indigo-50 text-indigo-700 text-sm font-bold px-4 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5 shadow-sm">
                      ✨ AI Query: "{lastQuery}"
                    </span>
                  )}
                </div>
              </div>
            </div>

            {searching ? (
              <div className="py-20 flex justify-center"><Spinner /></div>
            ) : searchResults.length === 0 ? (
              <div className="glass-panel border border-dashed border-gray-300 rounded-3xl p-20 text-center max-w-2xl mx-auto mt-10">
                <span className="text-6xl block mb-6">🔍</span>
                <h3 className="text-2xl font-black text-gray-900 mb-3">No products found</h3>
                <p className="text-gray-500 text-lg">We couldn't find anything matching your search. Try adjusting your keywords or turning off AI mode.</p>
                <button onClick={clearSearch} className="mt-8 bg-white border border-gray-200 text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {searchResults.map((p) => (
                  <ProductCard key={p.id} p={p} addToCart={addToCart} buyNow={buyNow} onView={handleViewProduct} isWishlisted={wishlistIds.has(p.id)} onToggleWishlist={handleToggleWishlist} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Home View */
          <div className="space-y-24 animate-fade-in">

            {/* Recommended Products */}
            {forYou.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    {forYouLabel}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {forYou.map((p) => (
                    <ProductCard key={p.id} p={p} addToCart={addToCart} buyNow={buyNow} onView={handleViewProduct} isWishlisted={wishlistIds.has(p.id)} onToggleWishlist={handleToggleWishlist} />
                  ))}
                </div>
              </div>
            )}

            {/* Shops Directory */}
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Explore Stores</h2>
                  <p className="text-gray-500 font-medium">Find the best local vendors by category</p>
                </div>
                
                {/* Category Filter */}
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                          activeCategory === cat 
                            ? "bg-indigo-600 text-white" 
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-indigo-600"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loadingShops ? (
                <div className="py-12 flex justify-center"><Spinner /></div>
              ) : filteredShops.length === 0 ? (
                <div className="glass-panel border-dashed rounded-3xl p-16 text-center text-gray-500">No shops available in this category.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredShops.map((shop, i) => (
                    <div
                      key={shop.id}
                      onClick={() => navigate(`/shops/${shop.id}`)}
                      className="group glass-panel rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex items-center gap-6 relative overflow-hidden"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-[100px] -z-10 group-hover:scale-125 transition-transform duration-500"></div>

                      <div className="h-20 w-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-4xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        🏬
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-gray-900 text-xl truncate group-hover:text-indigo-600 transition-colors">{shop.name}</h3>
                        {shop.category && (
                          <span className="inline-block mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg uppercase tracking-wider">
                            {shop.category}
                          </span>
                        )}
                        <p className="text-sm text-gray-500 mt-2 truncate font-medium">📍 {shop.address || "Online Store"}</p>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Products;