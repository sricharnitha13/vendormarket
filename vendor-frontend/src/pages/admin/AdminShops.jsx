import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  SUSPENDED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const IconCheck = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M4 10.5L8 14.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M5 5L15 15M15 5L5 15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPause = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <rect x="5" y="4" width="3.2" height="12" rx="1" />
    <rect x="11.8" y="4" width="3.2" height="12" rx="1" />
  </svg>
);
const IconPlay = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M6 4.5v11l9-5.5-9-5.5z" />
  </svg>
);
const IconSearch = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="9" cy="9" r="6" />
    <path d="M17 17l-4-4" strokeLinecap="round" />
  </svg>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  const styles = toast.type === "error" ? "bg-rose-600 text-white" : "bg-gray-900 text-white";
  return (
    <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${styles}`}>
      {toast.message}
    </div>
  );
};

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/shops/all", { params });
      setShops(res.data);
    } catch {
      notify("error", "Couldn't load shops. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchShops, 300);
    return () => clearTimeout(timer);
  }, [fetchShops]);

  const runAction = async (shop, action, successMessage, extraBody) => {
    setActionId(shop.id);
    try {
      await api.put(`/shops/${shop.id}/${action}`, extraBody);
      notify("success", successMessage);
      fetchShops();
    } catch (err) {
      notify("error", err.response?.data?.message || `Couldn't ${action} this shop.`);
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = (shop) => runAction(shop, "approve", `${shop.name} approved`);

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionId(rejectTarget.id);
    try {
      await api.put(`/shops/${rejectTarget.id}/reject`, { reason: rejectReason.trim() });
      notify("success", `${rejectTarget.name} rejected`);
      setRejectTarget(null);
      fetchShops();
    } catch (err) {
      notify("error", err.response?.data?.message || "Couldn't reject this shop.");
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmed = async () => {
    const { shop, action } = confirmTarget;
    const label = action === "suspend" ? "suspended" : "reactivated";
    await runAction(shop, action, `${shop.name} ${label}`);
    setConfirmTarget(null);
  };

  const pendingCount = shops.filter((s) => s.status === "PENDING").length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toast toast={toast} />

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
          <p className="text-sm text-gray-500 mt-1">
            {shops.length} shop{shops.length === 1 ? "" : "s"}
            {pendingCount > 0 && <> · {pendingCount} waiting on approval</>}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop name or owner email"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading shops…</div>
        ) : shops.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-700 font-medium">No shops match these filters</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term or status.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{shop.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[shop.status]}`}>
                      {shop.status}
                    </span>
                  </div>
                  {shop.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{shop.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {shop.ownerEmail} · {shop.category || "Uncategorized"} · Joined {formatDate(shop.createdAt)}
                  </p>
                  {shop.status === "REJECTED" && shop.rejectionReason && (
                    <p className="text-xs text-rose-600 mt-1.5 bg-rose-50 inline-block px-2 py-1 rounded-md">
                      Reason: {shop.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {shop.status === "PENDING" && (
                    <>
                      <button
                        disabled={actionId === shop.id}
                        onClick={() => handleApprove(shop)}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        disabled={actionId === shop.id}
                        onClick={() => {
                          setRejectTarget(shop);
                          setRejectReason("");
                        }}
                        className="inline-flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                      >
                        <IconX className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  {shop.status === "APPROVED" && (
                    <button
                      disabled={actionId === shop.id}
                      onClick={() => setConfirmTarget({ shop, action: "suspend" })}
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      <IconPause className="w-3.5 h-3.5" />
                      Suspend
                    </button>
                  )}

                  {shop.status === "SUSPENDED" && (
                    <button
                      disabled={actionId === shop.id}
                      onClick={() => setConfirmTarget({ shop, action: "reactivate" })}
                      className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      <IconPlay className="w-3.5 h-3.5" />
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900">Reject {rejectTarget.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              This is shown to the vendor, so be specific about what needs to change.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. Business address couldn't be verified"
              className="w-full mt-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionId === rejectTarget.id}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Reject shop
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {confirmTarget.action === "suspend" ? "Suspend" : "Reactivate"} {confirmTarget.shop.name}?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {confirmTarget.action === "suspend"
                ? "Their shop and products will be hidden from customers until reactivated."
                : "Their shop will become visible to customers again."}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmed}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  confirmTarget.action === "suspend" ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                {confirmTarget.action === "suspend" ? "Suspend shop" : "Reactivate shop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShops;