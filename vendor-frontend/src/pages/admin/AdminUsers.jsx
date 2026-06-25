import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const ROLE_FILTERS = ["ALL", "CUSTOMER", "VENDOR", "ADMIN"];

const ROLE_STYLES = {
  CUSTOMER: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  VENDOR: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  ADMIN: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const IconSearch = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="9" cy="9" r="6" />
    <path d="M17 17l-4-4" strokeLinecap="round" />
  </svg>
);
const IconBan = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="10" cy="10" r="7" />
    <path d="M5.5 5.5l9 9" strokeLinecap="round" />
  </svg>
);
const IconCheck = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M4 10.5L8 14.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconShield = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 2l6 2.5v5c0 4-2.7 6.6-6 8.5-3.3-1.9-6-4.5-6-8.5v-5L10 2z" />
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/users/all", { params });
      setUsers(res.data);
    } catch {
      notify("error", "Couldn't load users. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleEnable = async (user) => {
    setActionId(user.id);
    try {
      await api.put(`/users/${user.id}/enable`);
      notify("success", `${user.name || user.email} re-enabled`);
      fetchUsers();
    } catch (err) {
      notify("error", err.response?.data?.message || "Couldn't enable this user.");
    } finally {
      setActionId(null);
    }
  };

  const handleDisableConfirmed = async () => {
    const user = confirmTarget;
    setActionId(user.id);
    try {
      await api.put(`/users/${user.id}/disable`);
      notify("success", `${user.name || user.email} disabled`);
      setConfirmTarget(null);
      fetchUsers();
    } catch (err) {
      notify("error", err.response?.data?.message || "Couldn't disable this user.");
    } finally {
      setActionId(null);
    }
  };

  const counts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toast toast={toast} />

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} user{users.length === 1 ? "" : "s"}
            {counts.CUSTOMER ? ` · ${counts.CUSTOMER} customers` : ""}
            {counts.VENDOR ? ` · ${counts.VENDOR} vendors` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {role === "ALL" ? "All" : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-700 font-medium">No users match these filters</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term or role.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{user.name || "Unnamed"}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[user.role]}`}>
                      {user.role}
                    </span>
                    {!user.enabled && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {user.phone || "No phone on file"} · Joined {formatDate(user.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user.role === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 px-2 py-1">
                      <IconShield className="w-3.5 h-3.5" />
                      Protected
                    </span>
                  ) : user.enabled ? (
                    <button
                      disabled={actionId === user.id}
                      onClick={() => setConfirmTarget(user)}
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-rose-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-50 disabled:opacity-50"
                    >
                      <IconBan className="w-3.5 h-3.5" />
                      Disable
                    </button>
                  ) : (
                    <button
                      disabled={actionId === user.id}
                      onClick={() => handleEnable(user)}
                      className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      <IconCheck className="w-3.5 h-3.5" />
                      Enable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Disable {confirmTarget.name || confirmTarget.email}?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              They won't be able to log in until you re-enable their account. Any session they already have open may continue working until it expires.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableConfirmed}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700"
              >
                Disable user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;