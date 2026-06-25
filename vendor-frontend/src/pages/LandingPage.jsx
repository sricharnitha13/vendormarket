import { Link } from "react-router-dom";

const features = [
  {
    icon: "🛍️",
    title: "Browse Products",
    description:
      "Discover a curated marketplace of products from independent vendors, all in one place.",
    bgColor: "bg-indigo-50/80 text-indigo-600 border-indigo-100/50",
  },
  {
    icon: "🏪",
    title: "Sell on Our Platform",
    description:
      "Set up your vendor shop in minutes and start listing products to reach more customers.",
    bgColor: "bg-purple-50/80 text-purple-600 border-purple-100/50",
  },
  {
    icon: "📦",
    title: "Track Orders",
    description:
      "Stay on top of every purchase or sale with real-time order tracking and history.",
    bgColor: "bg-emerald-50/80 text-emerald-600 border-emerald-100/50",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">
      {/* Hero Section */}
      <section className="relative bg-[#0B0F19] text-white overflow-hidden py-24 sm:py-36">
        {/* Advanced Glow blobs */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-panel-dark text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 mb-8 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            Your Local Marketplace, Reimagined
          </span>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] mb-8 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            The simplest way to <br className="hidden sm:block" /> shop & sell locally.
          </h1>
          
          <p className="text-lg sm:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            Discover verified products from independent vendors in your community, or launch your own store in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-5 sm:gap-6">
            <Link
              to="/products"
              className="px-8 py-4 rounded-2xl bg-white text-indigo-950 font-bold hover:bg-indigo-50 active:scale-95 hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 text-lg"
            >
              Start Browsing
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 rounded-2xl glass-panel-dark text-white font-bold hover:bg-white/10 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center text-lg group"
            >
              Create Free Account
              <span className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-32 relative z-10">
        <div className="text-center mb-20 animate-slide-in">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Everything you need in one powerful app
          </h2>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium">
            Whether you're here to discover verified local items or grow your business, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col items-start relative overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className={`text-5xl p-5 rounded-2xl border ${f.bgColor} mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">
                {f.title}
              </h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-24 sm:pb-32">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[32px] p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          
          <h3 className="text-2xl sm:text-4xl font-extrabold mb-4 relative z-10">
            Ready to experience the marketplace?
          </h3>
          <p className="text-indigo-200 mb-10 max-w-md mx-auto text-sm sm:text-base font-medium relative z-10">
            Sign up today and get access to special coupons, local listings, and smart checkout.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 hover:scale-[1.03] active:scale-95 transition-all shadow-md relative z-10"
          >
            Get Started Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;