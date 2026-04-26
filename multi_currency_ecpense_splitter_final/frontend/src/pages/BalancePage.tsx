import { useEffect, useState } from "react";
import api from "../services/api";

type Group = { _id: string; name: string };

type DashboardData = {
  summary: { baseCurrency: string };
  balances: Array<{ _id: string; userId: { _id: string; name: string }; owes: number; owed: number }>;
  settlements: Array<{ fromUser: { name: string }; toUser: { name: string }; amount: number; currency: string }>;
  settlementHistory?: Array<{ _id: string; fromUser: { _id: string; name: string }; toUser: { _id: string; name: string }; amount: number; currency: string; completedAt?: string }>;
};

const avatarColor = (name: string) => {
  const colors = ["#3d8c5f", "#2563eb", "#7c3aed", "#db2777", "#d97706", "#0891b2"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const BalancePage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settlingId, setSettlingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await api.get("/groups");
        setGroups(response.data);
        const active = localStorage.getItem("activeGroupId") || response.data[0]?._id || "";
        setGroupId(active);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load groups");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    const loadDashboard = async () => {
      if (!groupId) { setDashboard(null); return; }
      setLoading(true);
      setError("");
      try {
        localStorage.setItem("activeGroupId", groupId);
        const response = await api.get("/dashboard/" + groupId);
        setDashboard(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load balances");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
    if (groupId) {
      interval = window.setInterval(() => {
        api.get("/dashboard/" + groupId).then((r) => setDashboard(r.data)).catch(() => {});
      }, 15000);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [groupId]);

  const handleSettle = async (item: DashboardData["settlements"][0], index: number) => {
    const key = `${item.fromUser.name}-${index}`;
    setSettlingId(key);
    setError("");
    setMessage("");
    try {
      const from = dashboard?.balances.find((b) => b.userId.name === item.fromUser.name);
      const to = dashboard?.balances.find((b) => b.userId.name === item.toUser.name);
      if (!from || !to) return;
      await api.post("/settlements/complete", {
        groupId,
        fromUser: from.userId._id,
        toUser: to.userId._id,
        amount: item.amount,
        currency: item.currency,
        notes: "Settled from UI",
      });
      setMessage("Settlement marked as completed.");
      const refreshed = await api.get("/dashboard/" + groupId);
      setDashboard(refreshed.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not mark settlement complete");
    } finally {
      setSettlingId(null);
    }
  };

  const currency = dashboard?.summary.baseCurrency || "";
  const totalOwed = dashboard?.balances.reduce((sum, b) => sum + b.owed, 0) || 0;
  const totalOwes = dashboard?.balances.reduce((sum, b) => sum + b.owes, 0) || 0;
  const settledCount = dashboard?.settlementHistory?.length || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .bp-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 20px 64px;
          color: #1a1f2e;
        }

        /* Header */
        .bp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .bp-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3d8c5f;
          margin: 0 0 6px;
        }
        .bp-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #1a1f2e;
        }
        .bp-group-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f4f6f3;
          border: 1.5px solid #e2e8df;
          border-radius: 12px;
          padding: 8px 14px;
          align-self: flex-start;
        }
        .bp-group-label {
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .bp-group-select {
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #1a1f2e;
          cursor: pointer;
          outline: none;
          min-width: 140px;
        }

        /* Stats Row */
        .bp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 560px) { .bp-stats { grid-template-columns: 1fr; } }
        .bp-stat-card {
          background: #fff;
          border: 1.5px solid #e8ede6;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 2px 8px rgba(30,50,30,0.04);
        }
        .bp-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #9ca3af;
          margin-bottom: 8px;
        }
        .bp-stat-value {
          font-family: 'DM Mono', monospace;
          font-size: 24px;
          font-weight: 600;
          color: #1a1f2e;
          line-height: 1;
        }
        .bp-stat-value.positive { color: #16a34a; }
        .bp-stat-value.negative { color: #dc2626; }
        .bp-stat-sub {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        /* Grid layout */
        .bp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .bp-grid-full { grid-column: 1 / -1; }
        @media (max-width: 680px) { .bp-grid { grid-template-columns: 1fr; } }

        /* Panel */
        .bp-panel {
          background: #fff;
          border: 1.5px solid #e8ede6;
          border-radius: 20px;
          padding: 22px 22px 18px;
          box-shadow: 0 2px 12px rgba(30,50,30,0.04);
        }
        .bp-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .bp-panel-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1f2e;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }
        .bp-panel-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #3d8c5f;
          flex-shrink: 0;
        }
        .bp-badge {
          font-size: 11px;
          font-weight: 700;
          background: #edf7f1;
          color: #3d8c5f;
          border-radius: 50px;
          padding: 2px 8px;
        }

        /* Balance rows */
        .bp-balance-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .bp-balance-row:last-child { border-bottom: none; padding-bottom: 0; }
        .bp-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .bp-balance-name {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #1a1f2e;
        }
        .bp-balance-chips {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .bp-chip {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 50px;
        }
        .bp-chip-owed {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .bp-chip-owes {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #fed7aa;
        }

        /* Settlement rows */
        .bp-settle-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .bp-settle-row:last-child { border-bottom: none; padding-bottom: 0; }
        .bp-settle-arrow {
          font-size: 13px;
          color: #9ca3af;
          flex-shrink: 0;
        }
        .bp-settle-info { flex: 1; min-width: 0; }
        .bp-settle-names {
          font-size: 13.5px;
          font-weight: 600;
          color: #1a1f2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bp-settle-names span { color: #9ca3af; font-weight: 400; }
        .bp-settle-amount {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #1a1f2e;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .bp-settle-btn {
          border: none;
          border-radius: 8px;
          padding: 7px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          background: #2d7a52;
          color: #fff;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .bp-settle-btn:hover:not(:disabled) {
          background: #236643;
          transform: translateY(-1px);
        }
        .bp-settle-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* History rows */
        .bp-history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .bp-history-row:last-child { border-bottom: none; padding-bottom: 0; }
        .bp-history-icon {
          width: 32px; height: 32px;
          background: #f0fdf4;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .bp-history-info { flex: 1; min-width: 0; }
        .bp-history-names {
          font-size: 13.5px;
          font-weight: 600;
          color: #1a1f2e;
        }
        .bp-history-date {
          font-size: 11.5px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .bp-history-amount {
          font-family: 'DM Mono', monospace;
          font-size: 13.5px;
          font-weight: 600;
          color: #16a34a;
          flex-shrink: 0;
        }

        /* Alerts */
        .bp-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .bp-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .bp-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }

        /* Empty */
        .bp-empty {
          text-align: center;
          padding: 28px 16px;
          color: #9ca3af;
        }
        .bp-empty-icon { font-size: 32px; margin-bottom: 10px; }
        .bp-empty-text { font-size: 13.5px; font-weight: 500; }

        /* Settled badge */
        .bp-settled-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0fdf4;
          border: 1.5px solid #bbf7d0;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 600;
          color: #16a34a;
        }

        /* Loading skeleton */
        .bp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: #9ca3af;
          font-size: 14px;
          gap: 10px;
        }
        .bp-spinner {
          width: 20px; height: 20px;
          border: 2.5px solid #e2e8df;
          border-top-color: #3d8c5f;
          border-radius: 50%;
          animation: bp-spin 0.7s linear infinite;
        }
        @keyframes bp-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="bp-root">
        {/* Header */}
        <div className="bp-header">
          <div>
            <p className="bp-eyebrow">Smart Settlement</p>
            <h1 className="bp-title">Balance & Settlement</h1>
          </div>
          <div className="bp-group-bar">
            <span className="bp-group-label">Group</span>
            <select
              className="bp-group-select"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Select group…</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alerts */}
        {error && groupId && error !== "Access denied" && (
          <div className="bp-alert bp-alert-error">⚠️ {error}</div>
        )}
        {message && (
          <div className="bp-alert bp-alert-success">✅ {message}</div>
        )}

        {/* No group */}
        {!loading && !groupId && (
          <div className="bp-panel" style={{ textAlign: "center", padding: "48px 28px" }}>
            <div className="bp-empty-icon">⚖️</div>
            <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 8px" }}>No group selected</p>
            <p className="bp-empty-text" style={{ marginBottom: 20 }}>
              Select, join, or create a group to view balances and settlements.
            </p>
            <button
              style={{ background: "#2d7a52", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              onClick={() => window.location.href = "/groups"}
            >
              Browse Groups
            </button>
          </div>
        )}

        {/* Access denied */}
        {!loading && error === "Access denied" && groupId && (
          <div className="bp-panel" style={{ textAlign: "center", padding: "48px 28px" }}>
            <div className="bp-empty-icon">🔒</div>
            <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 8px" }}>Access Denied</p>
            <p className="bp-empty-text" style={{ marginBottom: 20 }}>You don't have access to this group.</p>
            <button
              style={{ background: "#2d7a52", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              onClick={() => window.location.href = "/groups"}
            >
              Go to Groups
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && groupId && (
          <div className="bp-loading">
            <div className="bp-spinner" />
            Loading balances…
          </div>
        )}

        {/* Dashboard */}
        {!loading && dashboard && (
          <>
            {/* Stats */}
            <div className="bp-stats">
              <div className="bp-stat-card">
                <div className="bp-stat-label">Total Owed to Group</div>
                <div className="bp-stat-value positive">
                  {totalOwed.toFixed(2)}
                </div>
                <div className="bp-stat-sub">{currency}</div>
              </div>
              <div className="bp-stat-card">
                <div className="bp-stat-label">Total Owes in Group</div>
                <div className="bp-stat-value negative">
                  {totalOwes.toFixed(2)}
                </div>
                <div className="bp-stat-sub">{currency}</div>
              </div>
              <div className="bp-stat-card">
                <div className="bp-stat-label">Settlements Done</div>
                <div className="bp-stat-value">{settledCount}</div>
                <div className="bp-stat-sub">completed</div>
              </div>
            </div>

            <div className="bp-grid">
              {/* Balance Sheet */}
              <div className="bp-panel">
                <div className="bp-panel-header">
                  <p className="bp-panel-title">
                    <span className="bp-panel-dot" />
                    Balance Sheet
                  </p>
                  {dashboard.balances.length > 0 && (
                    <span className="bp-badge">{dashboard.balances.length} members</span>
                  )}
                </div>
                {dashboard.balances.length === 0 ? (
                  <div className="bp-empty">
                    <div className="bp-empty-icon">📊</div>
                    <p className="bp-empty-text">No balance data yet.</p>
                  </div>
                ) : (
                  dashboard.balances.map((item) => (
                    <div key={item._id} className="bp-balance-row">
                      <div
                        className="bp-avatar"
                        style={{ background: avatarColor(item.userId.name) }}
                      >
                        {item.userId.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="bp-balance-name">{item.userId.name}</span>
                      <div className="bp-balance-chips">
                        {item.owed > 0 && (
                          <span className="bp-chip bp-chip-owed">
                            +{item.owed.toFixed(2)}
                          </span>
                        )}
                        {item.owes > 0 && (
                          <span className="bp-chip bp-chip-owes">
                            -{item.owes.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Settlement Suggestions */}
              <div className="bp-panel">
                <div className="bp-panel-header">
                  <p className="bp-panel-title">
                    <span className="bp-panel-dot" />
                    Settlement Suggestions
                  </p>
                  {dashboard.settlements.length > 0 && (
                    <span className="bp-badge">{dashboard.settlements.length} pending</span>
                  )}
                </div>
                {dashboard.settlements.length === 0 ? (
                  <div className="bp-settled-banner">
                    <span>🎉</span>
                    All settled up! No payments needed.
                  </div>
                ) : (
                  dashboard.settlements.map((item, index) => {
                    const key = `${item.fromUser.name}-${index}`;
                    return (
                      <div key={key} className="bp-settle-row">
                        <div
                          className="bp-avatar"
                          style={{ background: avatarColor(item.fromUser.name), width: 30, height: 30, fontSize: 12 }}
                        >
                          {item.fromUser.name.charAt(0)}
                        </div>
                        <div className="bp-settle-info">
                          <div className="bp-settle-names">
                            {item.fromUser.name} <span>→ pays</span> {item.toUser.name}
                          </div>
                        </div>
                        <span className="bp-settle-amount">
                          {item.amount.toFixed(2)} {item.currency}
                        </span>
                        <button
                          className="bp-settle-btn"
                          disabled={settlingId === key}
                          onClick={() => handleSettle(item, index)}
                        >
                          {settlingId === key ? "…" : "Settle Up"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Settlement History */}
              <div className="bp-panel bp-grid-full">
                <div className="bp-panel-header">
                  <p className="bp-panel-title">
                    <span className="bp-panel-dot" />
                    Settlement History
                  </p>
                  {(dashboard.settlementHistory?.length || 0) > 0 && (
                    <span className="bp-badge">{dashboard.settlementHistory!.length} completed</span>
                  )}
                </div>
                {!dashboard.settlementHistory || dashboard.settlementHistory.length === 0 ? (
                  <div className="bp-empty">
                    <div className="bp-empty-icon">🕐</div>
                    <p className="bp-empty-text">No completed settlements yet.</p>
                  </div>
                ) : (
                  dashboard.settlementHistory.map((item) => (
                    <div key={item._id} className="bp-history-row">
                      <div className="bp-history-icon">✅</div>
                      <div className="bp-history-info">
                        <div className="bp-history-names">
                          {item.fromUser?.name} → {item.toUser?.name}
                        </div>
                        <div className="bp-history-date">
                          {item.completedAt
                            ? new Date(item.completedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                            : "—"}
                        </div>
                      </div>
                      <span className="bp-history-amount">
                        +{item.amount.toFixed(2)} {item.currency}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default BalancePage;