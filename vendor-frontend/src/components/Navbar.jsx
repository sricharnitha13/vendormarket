
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import ChatWidget from "./ChatWidget";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  if (user?.role === "VENDOR") {
    return null;
  }

  const handleLogout = () => {
    setOpen(false);
    setProfileDropdown(false);
    logout();
    navigate("/home");
  };

  const close = () => {
    setOpen(false);
    setProfileDropdown(false);
  };

  // Sends the person somewhere useful depending on what triggered the notification.
  const handleNotificationClick = (notification) => {
    close();
    if (notification.relatedEntityType === "ORDER") {
      navigate("/orders");
    } else if (notification.relatedEntityType === "SHOP" && user?.role === "ADMIN") {
      navigate("/admin/api/shops");
    } else if (notification.relatedEntityType === "COUPON") {
      navigate("/cart");
    }
  };

  return (
    <>
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-200/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to={user ? "/" : "/home"} onClick={close} className="flex-shrink-0 flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
              VendorMarket
            </span>
          </Link>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
              Browse
            </Link>

            {user?.role === "ADMIN" && (
              <Link to="/admin" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                Admin Panel
              </Link>
            )}

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            {user ? (
              <div className="flex items-center gap-5">
                {user.role === "CUSTOMER" && (
                  <>
                    <Link to="/orders" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5" title="Orders">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                      <span className="text-sm font-medium hidden lg:block">Orders</span>
                    </Link>
                    <Link to="/cart" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 relative" title="Cart">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      <span className="text-sm font-medium hidden lg:block">Cart</span>
                    </Link>
                  </>
                )}

                <NotificationBell onNotificationClick={handleNotificationClick} />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 focus:outline-none transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {profileDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={close}></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role}</p>
                        </div>
                        <div className="py-1">
                          {user.role === "CUSTOMER" && (
                            <Link onClick={close} to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600">
                              My Profile
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2">
                  Log in
                </Link>
                <Link to="/register" className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 transition-colors shadow-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-3">
            {user?.role === "CUSTOMER" && (
              <Link to="/cart" onClick={close} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </Link>
            )}

            {user && <NotificationBell onNotificationClick={handleNotificationClick} />}

            <button
              onClick={() => setOpen(!open)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {open ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200/50 bg-white/90 backdrop-blur-md shadow-lg animate-fade-in absolute w-full left-0">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link to="/products" onClick={close} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
              Browse Products
            </Link>
            
            {user?.role === "ADMIN" && (
              <Link to="/admin" onClick={close} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
                Admin Panel
              </Link>
            )}
            
            {user?.role === "CUSTOMER" && (
              <>
                <Link to="/orders" onClick={close} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
                  My Orders
                </Link>
                <Link to="/profile" onClick={close} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
                  My Profile
                </Link>
              </>
            )}

            {!user ? (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Link to="/login" onClick={close} className="block text-center w-full px-4 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Log in
                </Link>
                <Link to="/register" onClick={close} className="block text-center w-full px-4 py-2 border border-transparent rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    {user?.role === "CUSTOMER" && <ChatWidget />}
    </>
  );
};

export default Navbar;