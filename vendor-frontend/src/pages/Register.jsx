import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CUSTOMER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const extractErrorMessage = (err) => {
    const data = err.response?.data;
    if (!data) return "Registration failed. Please try again.";
    if (data.message) return data.message;
    if (data.errors) {
      if (Array.isArray(data.errors)) {
        return data.errors.map((e) => e.defaultMessage || e.message).join(" ");
      }
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey) return data.errors[firstKey];
    }
    return "Registration failed. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-100/80 relative overflow-hidden px-4 py-12">
      {/* Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300 opacity-25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/60 w-full max-w-md relative z-10 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25 mb-4">
            🛍️
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Create Account</h2>
          <p className="text-sm font-medium text-slate-500 mt-1.5 text-center">Join the VendorMarket community</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-6 text-center bg-red-50 border border-red-100 rounded-2xl py-3 px-4 font-medium flex items-center justify-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block pl-1">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block pl-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block pl-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
            {form.password.length > 0 && form.password.length < 6 && (
              <p className="text-xs text-amber-600 mt-1.5 pl-1 font-medium">
                ⚠️ {6 - form.password.length} more character{6 - form.password.length === 1 ? "" : "s"} needed
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block pl-1">I want to join as a</label>
            <select
              className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-semibold cursor-pointer"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="CUSTOMER">Customer (to shop products)</option>
              <option value="VENDOR">Vendor (to sell products)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl shadow-indigo-600/25 active:scale-98 hover:scale-[1.01] transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm mt-8 text-slate-500 font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
