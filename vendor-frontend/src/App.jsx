import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import api, { subscribeToConnectionStatus } from "./api/axios";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/Productdetail";
import ShopProfile from "./pages/Shopprofile";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import CustomerProfile from "./pages/CustomerProfile";
import VendorShop from "./pages/vendor/VendorShop";
import VendorDashboard from "./pages/vendor/Vendordashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import AdminPanel from "./pages/admin/AdminPanel";
import VendorCoupons from "./pages/vendor/VendorCoupons";
import VendorLayout from "./components/VendorLayout";

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/home" />;
  if (user.role === "VENDOR") return <Navigate to="/vendor/shop" />;
  if (user.role === "ADMIN") return <Navigate to="/admin" />;
  return <Navigate to="/products" />;
};

function App() {
  const [serverFailed, setServerFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((isFailed) => {
      setServerFailed(isFailed);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!serverFailed) return;

    let active = true;
    const interval = setInterval(async () => {
      if (retrying) return;
      setRetrying(true);
      try {
        await api.get("/shops");
        if (active) {
          setServerFailed(false);
          window.location.reload();
        }
      } catch (e) {
        // server still down
      } finally {
        if (active) setRetrying(false);
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [serverFailed, retrying]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        {serverFailed && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center z-[9999] p-6 text-center animate-fade-in">
            {/* Pulsing wave animations */}
            <div className="relative mb-8 flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-indigo-500/20 rounded-full animate-ping"></div>
              <div className="absolute w-16 h-16 bg-purple-500/30 rounded-full animate-ping [animation-delay:0.5s]"></div>
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/50">
                📡
              </div>
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight mb-3 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent animate-pulse">
              Waking Up Cloud Server...
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed mb-6 font-medium">
              We host our application on a cold-start platform to save resources. The API is warming up and should be ready in about 30 seconds.
            </p>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 shadow-inner mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {retrying ? "Checking connection..." : "Waiting for response..."}
              </span>
            </div>

            <button
              onClick={() => {
                setRetrying(true);
                api.get("/shops").then(() => {
                  setServerFailed(false);
                  window.location.reload();
                }).catch(() => {
                  setRetrying(false);
                });
              }}
              className="bg-white text-indigo-950 font-bold px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 text-xs shadow-md uppercase tracking-wider"
            >
              Try manual check
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/products"
            element={
              <RoleProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <Products />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <RoleProtectedRoute allowedRoles={["CUSTOMER"]}>
                <ProductDetail />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/shops/:id"
            element={
              <RoleProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <ShopProfile />
              </RoleProtectedRoute>
            }
          />

          {/* Buyer routes */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

          {/* Vendor routes */}
          <Route path="/vendor/dashboard" element={
            <RoleProtectedRoute allowedRoles={["VENDOR"]}>
              <VendorLayout>
                <VendorDashboard />
              </VendorLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/vendor/shop" element={
            <RoleProtectedRoute allowedRoles={["VENDOR"]}>
              <VendorLayout>
                <VendorShop />
              </VendorLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/vendor/products" element={
            <RoleProtectedRoute allowedRoles={["VENDOR"]}>
              <VendorLayout>
                <VendorProducts />
              </VendorLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/vendor/orders" element={
            <RoleProtectedRoute allowedRoles={["VENDOR"]}>
              <VendorLayout>
                <VendorOrders />
              </VendorLayout>
            </RoleProtectedRoute>
          } />
          <Route path="/vendor/coupons" element={
            <RoleProtectedRoute allowedRoles={["VENDOR"]}>
              <VendorLayout>
                <VendorCoupons />
              </VendorLayout>
            </RoleProtectedRoute>
          } /> 
          {/* Admin routes */}
          <Route path="/admin" element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminPanel />
            </RoleProtectedRoute>
          } />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;