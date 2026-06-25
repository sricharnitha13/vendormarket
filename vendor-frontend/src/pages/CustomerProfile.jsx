import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const CustomerProfile = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Please log in</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to view your profile.</p>
        <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your account details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: User Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="relative mt-8 mb-4">
              <div className="w-24 h-24 bg-white rounded-full shadow-md border-4 border-white flex items-center justify-center text-4xl text-indigo-600 font-bold mx-auto">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 truncate">{user.email}</h2>
            <p className="text-sm text-gray-500 uppercase tracking-widest mt-1 font-semibold">{user.role}</p>

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
              <button 
                onClick={logout}
                className="w-full bg-white border border-gray-200 text-red-600 font-medium py-2 rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Quick Links */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚙️</span> Account Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium cursor-not-allowed">
                  {user.email}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Email address cannot be changed currently.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚡</span> Quick Links
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/orders" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  📦
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">My Orders</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Track & view past orders</p>
                </div>
              </Link>
              
              <Link to="/cart" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  🛒
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">Shopping Cart</h4>
                  <p className="text-xs text-gray-500 mt-0.5">View your saved items</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
