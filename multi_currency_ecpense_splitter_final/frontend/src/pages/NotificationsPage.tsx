import { useEffect, useState } from "react";
import api from "../services/api";

const notifIcon = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("settle") || m.includes("paid")) return "💸";
  if (m.includes("expense") || m.includes("added")) return "🧾";
  if (m.includes("group") || m.includes("joined")) return "👥";
  if (m.includes("invite")) return "✉️";
  if (m.includes("removed") || m.includes("deleted")) return "🗑️";
  if (m.includes("role") || m.includes("admin")) return "⭐";
  return "🔔";
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = async () => {
    const response = await api.get("/notifications");
    setNotifications(response.data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    setMarkingId(id);
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
    );
    setMarkingId(null);
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => api.patch(`/notifications/${n._id}/read`)));
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .np-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 680px;
          margin: 0 auto;
          padding: 32px 20px 64px;
          color: #1a1f2e;
        }

        /* Header */
        .np-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .np-eyebrow {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #3d8c5f; margin: 0 0 6px;
        }
        .np-title-row {
          display: flex; align-items: center; gap: 12px;
        }
        .np-title {
          font-size: 28px; font-weight: 700;
          margin: 0; color: #1a1f2e;
        }
        .np-unread-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 24px; height: 24px;
          background: #3d8c5f; color: #fff;
          border-radius: 50px; font-size: 12px; font-weight: 700;
          padding: 0 6px;
        }
        .np-mark-all {
          border: none; background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #3d8c5f; cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.15s;
          white-space: nowrap;
          align-self: flex-end;
        }
        .np-mark-all:hover { background: #edf7f1; }

        /* Panel */
        .np-panel {
          background: #fff;
          border: 1.5px solid #e8ede6;
          border-radius: 20px;
          padding: 6px 0;
          box-shadow: 0 2px 12px rgba(30,50,30,0.05);
          overflow: hidden;
        }

        /* Notification item */
        .np-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
          position: relative;
        }
        .np-item:last-child { border-bottom: none; }
        .np-item:hover { background: #fafcfa; }
        .np-item.unread { background: #f7fbf8; }
        .np-item.unread:hover { background: #f0f9f3; }

        /* Unread indicator */
        .np-unread-dot {
          position: absolute;
          left: 8px; top: 50%;
          transform: translateY(-50%);
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3d8c5f;
          flex-shrink: 0;
        }

        /* Icon */
        .np-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #f4f6f3;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
          margin-top: 1px;
        }
        .np-item.unread .np-icon { background: #edf7f1; }

        /* Content */
        .np-content { flex: 1; min-width: 0; }
        .np-message {
          font-size: 14px; font-weight: 500;
          color: #1a1f2e; line-height: 1.45;
          margin: 0 0 4px;
        }
        .np-item.unread .np-message { font-weight: 600; }
        .np-time {
          font-size: 12px; color: #9ca3af;
          font-family: 'DM Mono', monospace;
        }

        /* Right side */
        .np-right {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .np-read-chip {
          font-size: 11px; font-weight: 600;
          color: #9ca3af; background: #f3f4f6;
          border-radius: 50px; padding: 3px 10px;
          letter-spacing: 0.04em;
        }
        .np-mark-btn {
          border: 1.5px solid #d8eddf;
          background: #edf7f1; color: #2d7a52;
          border-radius: 8px; padding: 6px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
          transition: all 0.15s;
        }
        .np-mark-btn:hover:not(:disabled) {
          background: #d8f0e3; border-color: #3d8c5f;
        }
        .np-mark-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Empty state */
        .np-empty {
          text-align: center;
          padding: 56px 20px;
        }
        .np-empty-icon { font-size: 48px; margin-bottom: 14px; }
        .np-empty-title {
          font-size: 16px; font-weight: 700;
          color: #1a1f2e; margin: 0 0 6px;
        }
        .np-empty-sub {
          font-size: 14px; color: #9ca3af; margin: 0;
        }

        /* Loading */
        .np-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; padding: 56px 20px;
          color: #9ca3af; font-size: 14px;
        }
        .np-spinner {
          width: 20px; height: 20px;
          border: 2.5px solid #e2e8df;
          border-top-color: #3d8c5f;
          border-radius: 50%;
          animation: np-spin 0.7s linear infinite;
        }
        @keyframes np-spin { to { transform: rotate(360deg); } }

        /* Summary bar */
        .np-summary {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 20px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 12.5px; color: #6b7280; font-weight: 500;
        }
        .np-summary-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3d8c5f; flex-shrink: 0;
        }
      `}</style>

      <div className="np-root">
        {/* Header */}
        <div className="np-header">
          <div>
            <p className="np-eyebrow">Activity Alerts</p>
            <div className="np-title-row">
              <h1 className="np-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="np-unread-badge">{unreadCount}</span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button className="np-mark-all" onClick={markAllRead}>
              ✓ Mark all read
            </button>
          )}
        </div>

        {/* Panel */}
        <div className="np-panel">
          {loading ? (
            <div className="np-loading">
              <div className="np-spinner" />
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div className="np-empty">
              <div className="np-empty-icon">🔔</div>
              <p className="np-empty-title">You're all caught up!</p>
              <p className="np-empty-sub">No notifications yet. Activity will appear here.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="np-summary">
                <span className="np-summary-dot" />
                {unreadCount > 0
                  ? `${unreadCount} unread · ${notifications.length} total`
                  : `All ${notifications.length} notifications read`}
              </div>

              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`np-item${item.isRead ? "" : " unread"}`}
                >
                  {!item.isRead && <span className="np-unread-dot" />}
                  <div className="np-icon">
                    {notifIcon(item.message || "")}
                  </div>
                  <div className="np-content">
                    <p className="np-message">{item.message}</p>
                    <span className="np-time">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="np-right">
                    {item.isRead ? (
                      <span className="np-read-chip">Read</span>
                    ) : (
                      <button
                        className="np-mark-btn"
                        disabled={markingId === item._id}
                        onClick={() => markRead(item._id)}
                      >
                        {markingId === item._id ? "…" : "Mark read"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;