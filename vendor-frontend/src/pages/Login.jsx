import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/login", form);
      login(res.data);
      if (res.data.role === "VENDOR") {
        navigate("/vendor/shop");
      } else if (res.data.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/products");
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-100/80 relative overflow-hidden px-4">
      {/* Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300 opacity-25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/60 w-full max-w-md relative z-10 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25 mb-4">
            🛍️
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Welcome Back</h2>
          <p className="text-sm font-medium text-slate-500 mt-1.5 text-center">Login to your VendorMarket account</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-6 text-center bg-red-50 border border-red-100 rounded-2xl py-3 px-4 font-medium flex items-center justify-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block pl-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
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
              className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl shadow-indigo-600/25 active:scale-98 hover:scale-[1.01] transition-all flex items-center justify-center"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm mt-8 text-slate-500 font-medium">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
