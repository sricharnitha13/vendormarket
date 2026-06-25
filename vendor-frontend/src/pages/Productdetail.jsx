import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const RECENTLY_VIEWED_KEY = "recentlyViewedProducts";
const MAX_RECENT = 8;

const addRecentlyViewed = (product) => {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const filtered = current.filter((p) => p.id !== product.id);
    const updated = [
      { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl },
      ...filtered,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
};

const StarRating = ({ value, size = "text-lg", onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange && onChange(s)}
          className={`${size} ${onChange ? "cursor-pointer hover:scale-110 transition" : "cursor-default"} ${
            s <= Math.round(value) ? "text-amber-400" : "text-gray-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromShop = searchParams.get("from");
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [similar, setSimilar] = useState([]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}/detail`);
      setProduct(res.data);
      addRecentlyViewed(res.data);
    } catch {
      showToast("Failed to load product", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProduct();
    if (user) {
      api.get("/wishlist")
        .then((res) => setIsWishlisted(res.data.some((w) => w.productId === Number(id))))
        .catch(() => {});
      api.get(`/reviews/product/${id}/mine`)
        .then((res) => {
          if (res.data) {
            setMyRating(res.data.rating);
            setMyComment(res.data.comment || "");
            setHasReviewed(true);
          }
        })
        .catch(() => {});
    } else {
      setIsWishlisted(false);
      setMyRating(0);
      setMyComment("");
      setHasReviewed(false);
    }
    api.get(`/ai/recommendations/similar/${id}`)
      .then((res) => setSimilar(res.data))
      .catch(() => setSimilar([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const toggleWishlist = async () => {
    if (!user) {
      showToast("Please log in as a Customer to manage your wishlist", "info");
      navigate("/login");
      return;
    }
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/remove/${id}`);
        setIsWishlisted(false);
        showToast("Removed from wishlist", "success");
      } else {
        await api.post(`/wishlist/add/${id}`);
        setIsWishlisted(true);
        showToast("Added to wishlist ♥", "success");
      }
    } catch {
      showToast("Login as Customer to use wishlist", "error");
    }
  };

  const addToCart = async () => {
    if (!user) {
      showToast("Please log in as a Customer to add products to your cart", "info");
      navigate("/login");
      return;
    }
    try {
      await api.post("/cart/add", { productId: Number(id), quantity: 1 });
      showToast("Added to cart ✓", "success");
    } catch {
      showToast("Login as Customer to add to cart", "error");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please log in as a Customer to submit a review", "info");
      navigate("/login");
      return;
    }
    if (myRating === 0) {
      showToast("Please select a rating", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${id}`, { rating: myRating, comment: myComment });
      showToast(hasReviewed ? "Review updated ✓" : "Review submitted ✓", "success");
      setHasReviewed(true);
      fetchProduct();
    } catch {
      showToast("Login as Customer to leave a review", "error");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Product not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => fromShop ? navigate(`/products?shop=${fromShop}`) : navigate(-1)}
        className="text-sm text-gray-500 hover:text-indigo-600 transition mb-4 inline-flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative h-72 sm:h-96 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl opacity-40">📦</span>
          )}
          <button
            onClick={toggleWishlist}
            className="absolute top-3 left-3 h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <span className={`text-xl ${isWishlisted ? "text-red-500" : "text-gray-300"}`}>
              {isWishlisted ? "♥" : "♡"}
            </span>
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.shopName && (
            <button
              onClick={() => navigate(`/shops/${product.shopId}`)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline mb-1 text-left transition"
            >
              🏬 {product.shopName}
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center gap-2 mt-2">
            <StarRating value={product.averageRating || 0} />
            <span className="text-sm text-gray-500">
              {product.averageRating ? product.averageRating.toFixed(1) : "No ratings"}
              {product.reviewCount > 0 && ` (${product.reviewCount} review${product.reviewCount === 1 ? "" : "s"})`}
            </span>
          </div>

          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-3xl font-bold text-indigo-600">₹{product.price}</p>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                product.stock > 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}
            >
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="mt-6 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ratings & Reviews</h2>

        {/* Write a review */}
        <form onSubmit={submitReview} className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {hasReviewed ? "Your review" : "Write a review"}
          </p>
          <StarRating value={myRating} onChange={setMyRating} size="text-2xl" />
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={3}
            className="w-full mt-3 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition"
          >
            {submitting ? "Saving..." : hasReviewed ? "Update Review" : "Submit Review"}
          </button>
        </form>

        {/* Review list */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-3">
            {product.reviews.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-800 text-sm">{r.userName}</p>
                  <StarRating value={r.rating} size="text-sm" />
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No reviews yet. Be the first to review this product!</p>
        )}
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">✨ Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {similar.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden"
              >
                <div className="h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl opacity-40">📦</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                  <p className="text-sm text-indigo-600 font-bold mt-0.5">₹{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;