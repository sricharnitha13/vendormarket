import { useState, useEffect } from "react";
import api from "../api/axios";

const FollowButton = ({ shopId }) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/shops/${shopId}/following`)
      .then((res) => {
        if (active) setFollowing(res.data.following);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shopId]);

  const toggle = async () => {
    setSaving(true);
    try {
      if (following) {
        await api.delete(`/shops/${shopId}/follow`);
        setFollowing(false);
      } else {
        await api.post(`/shops/${shopId}/follow`);
        setFollowing(true);
      }
    } catch {
      // Leave state unchanged on failure rather than showing a false success.
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        following
          ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          : "bg-gray-900 text-white hover:bg-gray-800"
      }`}
    >
      {following ? "Following" : "Follow shop"}
    </button>
  );
};

export default FollowButton;