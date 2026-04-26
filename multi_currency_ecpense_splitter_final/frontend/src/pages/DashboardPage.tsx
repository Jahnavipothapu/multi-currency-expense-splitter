import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FaUsers, FaDollarSign, FaChartLine, FaCalendarAlt,
  FaTrophy, FaPlus, FaFire, FaExchangeAlt, FaLock, FaUserPlus,
} from "react-icons/fa";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Group = { _id: string; name: string };
type DashboardData = {
  group: { members: Array<{ _id: string }> };
  summary: { totalExpenses: number; totalExpenseBase: number; baseCurrency: string };
  categoryBreakdown: Array<{ category: string; total: number }>;
  monthlyTrends?: Array<{ month: string; total: number }>;
  topSpender?: { name: string; total: number } | null;
  recentActivity?: Array<{ type: string; date: string; message: string }>;
  recentTransactions: Array<{ _id: string; category?: string; description?: string; amount: number; currency: string; date: string }>;
};

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('[fonts.googleapis.com](https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300&family=Epilogue:wght@300;400;500;600;700&display=swap)');

:root {
  --bg:        #f5f3f0;
  --surface:   #ffffff;
  --raised:    #faf9f7;
  --border:    rgba(0,0,0,.06);
  --border-hi: rgba(0,0,0,.12);
  --text:      #1a1814;
  --muted:     #7a7570;
  --accent:    #2d6a4f;
  --accent2:   #40916c;
  --accent-soft: rgba(45,106,79,.08);
  --green:     #1b7a5e;
  --red:       #c0392b;
  --blue:      #2c5fad;
  --purple:    #6b3fa0;
  --orange:    #d97706;
  --r:         20px;
  --r-sm:      12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04);
}

.dp-wrap {
  font-family: 'Epilogue', sans-serif;
  color: var(--text);
  min-height: 100vh;
  background: var(--bg);
  padding: 0 0 100px;
}

/* ── Page toolbar ── */
.dp-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.dp-toolbar-left h1 {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -.8px;
  color: var(--text);
  line-height: 1.1;
}

.dp-toolbar-left p {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
}

.dp-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dp-select {
  background: var(--surface);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-sm);
  color: var(--text);
  font-family: 'Epilogue', sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  outline: none;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
  min-width: 180px;
  box-shadow: var(--shadow-sm);
}

.dp-select:focus { 
  border-color: var(--accent); 
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.dp-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  color: #ffffff;
  border: none;
  border-radius: var(--r-sm);
  padding: 10px 20px;
  font-family: 'Epilogue', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .2px;
  transition: transform .15s, box-shadow .2s;
  box-shadow: 0 4px 14px rgba(45,106,79,.3);
}

.dp-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(45,106,79,.35);
}

.dp-add-btn:active {
  transform: translateY(0);
}

/* ── Main content ── */
.dp-content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 40px 40px 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── State cards ── */
.dp-state-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 60px 40px;
  text-align: center;
  animation: fadeUp .4s ease both;
  box-shadow: var(--shadow-md);
}

.dp-state-card p { 
  color: var(--muted); 
  font-size: 16px;
  line-height: 1.6;
}

.dp-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 28px;
}

.dp-state-icon.loading {
  background: var(--accent-soft);
  color: var(--accent);
}

.dp-state-icon.empty {
  background: rgba(107,63,160,.1);
  color: var(--purple);
}

.dp-state-icon.locked {
  background: rgba(217,119,6,.1);
  color: var(--orange);
}

.dp-state-icon.error {
  background: rgba(192,57,43,.1);
  color: var(--red);
}

.dp-state-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  letter-spacing: -.4px;
}

.dp-state-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 28px;
  flex-wrap: wrap;
}

.dp-error {
  background: rgba(192,57,43,.04);
  border-color: rgba(192,57,43,.15);
}

.dp-spinner {
  width: 44px; 
  height: 44px;
  border: 3px solid var(--accent-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin: 0 auto;
}

@keyframes spin { to { transform: rotate(360deg); } }

.dp-goto-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-sm);
  color: var(--text);
  font-family: 'Epilogue', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  cursor: pointer;
  transition: all .2s;
  box-shadow: var(--shadow-sm);
}

.dp-goto-btn:hover { 
  background: var(--accent); 
  color: #ffffff; 
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.dp-goto-btn.primary {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

.dp-goto-btn.primary:hover {
  background: var(--accent2);
  border-color: var(--accent2);
}

/* ── Metric cards ── */
.dp-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1100px) { .dp-metrics { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 600px)  { .dp-metrics { grid-template-columns: 1fr; } }

.dp-metric {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 28px;
  position: relative;
  overflow: hidden;
  transition: border-color .25s, transform .2s, box-shadow .25s;
  animation: fadeUp .5s ease both;
  box-shadow: var(--shadow-sm);
}

.dp-metric:hover {
  border-color: var(--border-hi);
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.dp-metric-glow {
  position: absolute;
  width: 140px; height: 140px;
  border-radius: 50%;
  filter: blur(50px);
  top: -40px; right: -40px;
  opacity: .12;
  pointer-events: none;
}

.dp-metric-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  margin-bottom: 20px;
}

.dp-metric-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}

.dp-metric-value {
  font-family: 'Fraunces', serif;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -1px;
  line-height: 1;
  color: var(--text);
}

.dp-metric-sub {
  font-size: 13px;
  color: var(--muted);
  margin-top: 8px;
}

/* ── 2-col grid ── */
.dp-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 900px) { .dp-grid2 { grid-template-columns: 1fr; } }

/* ── 3-col grid ── */
.dp-grid3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}
@media (max-width: 1100px) { .dp-grid3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px)  { .dp-grid3 { grid-template-columns: 1fr; } }

/* ── Card shell ── */
.dp-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 28px;
  animation: fadeUp .5s ease both;
  box-shadow: var(--shadow-sm);
  transition: box-shadow .2s, border-color .2s;
}

.dp-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-hi);
}

.dp-card-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -.3px;
  color: var(--text);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dp-card-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.dp-empty {
  font-size: 14px;
  color: var(--muted);
  padding: 20px 0;
  text-align: center;
  background: var(--raised);
  border-radius: var(--r-sm);
}

/* ── Top Spender ── */
.dp-spender-box {
  background: linear-gradient(135deg, var(--raised) 0%, #fff 100%);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dp-spender-avatar {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(45,106,79,.25);
}

.dp-spender-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--text);
}

.dp-spender-sub {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}

.dp-spender-amount {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: -.6px;
  white-space: nowrap;
}

/* ── Monthly Trends ── */
.dp-bar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.dp-bar-row:last-child {
  margin-bottom: 0;
}

.dp-bar-month {
  width: 36px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: uppercase;
  color: var(--muted);
  flex-shrink: 0;
}

.dp-bar-track {
  flex: 1;
  height: 8px;
  background: var(--raised);
  border-radius: 100px;
  overflow: hidden;
}

.dp-bar-fill {
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent2) 100%);
  transition: width .8s cubic-bezier(.16,1,.3,1);
}

.dp-bar-val {
  width: 60px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

/* ── Category bars ── */
.dp-cat-row {
  margin-bottom: 18px;
}

.dp-cat-row:last-child {
  margin-bottom: 0;
}

.dp-cat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dp-cat-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.dp-cat-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.dp-cat-track {
  height: 6px;
  background: var(--raised);
  border-radius: 100px;
  overflow: hidden;
}

.dp-cat-fill {
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, var(--green) 0%, #2bb5a0 100%);
  transition: width .8s cubic-bezier(.16,1,.3,1);
}

/* ── Transactions ── */
.dp-tx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  background: var(--raised);
  border-radius: var(--r-sm);
  margin-bottom: 10px;
  border: 1px solid transparent;
  transition: border-color .2s, background .2s;
}

.dp-tx-row:last-child {
  margin-bottom: 0;
}

.dp-tx-row:hover { 
  border-color: var(--border-hi); 
  background: #fff;
}

.dp-tx-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  flex-shrink: 0;
}

.dp-tx-info { flex: 1; min-width: 0; }

.dp-tx-desc {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dp-tx-meta {
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
}

.dp-tx-amount {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

/* ── Activity feed ── */
.dp-activity-row {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
}

.dp-activity-row:last-child {
  margin-bottom: 0;
}

.dp-activity-row:last-child .dp-activity-connector {
  display: none;
}

.dp-activity-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.dp-activity-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue) 0%, #5b8af0 100%);
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 2px 6px rgba(44,95,173,.3);
}

.dp-activity-connector {
  width: 2px;
  flex: 1;
  background: var(--border);
  margin-top: 6px;
  border-radius: 1px;
}

.dp-activity-body { flex: 1; }

.dp-activity-msg {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.5;
}

.dp-activity-time {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.dp-activity-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 10px;
  background: rgba(91,138,240,.12);
  border: 1px solid rgba(91,138,240,.2);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: uppercase;
  color: var(--blue);
}

/* ── Animations ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dp-metric:nth-child(1) { animation-delay: .05s; }
.dp-metric:nth-child(2) { animation-delay: .10s; }
.dp-metric:nth-child(3) { animation-delay: .15s; }
.dp-metric:nth-child(4) { animation-delay: .20s; }

.dp-card:nth-child(1) { animation-delay: .1s; }
.dp-card:nth-child(2) { animation-delay: .15s; }
.dp-card:nth-child(3) { animation-delay: .2s; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .dp-content { padding: 24px 20px 0; }
  .dp-toolbar { flex-direction: column; align-items: stretch; gap: 16px; }
  .dp-toolbar-right { flex-direction: column; }
  .dp-select { width: 100%; }
  .dp-add-btn { width: 100%; justify-content: center; }
  .dp-state-card { padding: 48px 24px; }
  .dp-metric-value { font-size: 28px; }
}
`;

/* ─── Component ─────────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!document.getElementById("dp-styles")) {
      const tag = document.createElement("style");
      tag.id = "dp-styles";
      tag.textContent = CSS;
      document.head.appendChild(tag);
      styleRef.current = tag;
    }
    return () => { styleRef.current?.remove(); };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/groups");
        setGroups(res.data);
        const saved = localStorage.getItem("activeGroupId");
        setSelectedGroup(saved || res.data[0]?._id || "");
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load groups");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    const load = async () => {
      if (!selectedGroup) { setDashboard(null); return; }
      setLoading(true); setError("");
      try {
        localStorage.setItem("activeGroupId", selectedGroup);
        const res = await api.get("/dashboard/" + selectedGroup);
        setDashboard(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
    if (selectedGroup) {
      interval = window.setInterval(() => {
        api.get("/dashboard/" + selectedGroup).then((r) => setDashboard(r.data)).catch(() => {});
      }, 15000);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [selectedGroup]);

  const avgPerExpense = useMemo(() => {
    if (!dashboard || dashboard.summary.totalExpenses === 0) return 0;
    return dashboard.summary.totalExpenseBase / dashboard.summary.totalExpenses;
  }, [dashboard]);

  const topCategoryTotal = useMemo(() => {
    if (!dashboard || !dashboard.categoryBreakdown.length) return 1;
    return Math.max(...dashboard.categoryBreakdown.map((i) => i.total));
  }, [dashboard]);

  const maxMonthlyTotal = useMemo(() => {
    if (!dashboard?.monthlyTrends?.length) return 1;
    return Math.max(...dashboard.monthlyTrends.map((i) => i.total), 1);
  }, [dashboard]);

  const metrics = dashboard
    ? [
        {
          label: "Total Expenses",
          value: dashboard.summary.totalExpenses.toString(),
          sub: "transactions logged",
          icon: <FaDollarSign />,
          iconBg: "rgba(45,106,79,.12)",
          iconColor: "var(--accent)",
          glowColor: "var(--accent)",
        },
        {
          label: "Total Amount",
          value: `${dashboard.summary.totalExpenseBase.toFixed(2)}`,
          sub: dashboard.summary.baseCurrency,
          icon: <FaChartLine />,
          iconBg: "rgba(27,122,94,.12)",
          iconColor: "var(--green)",
          glowColor: "var(--green)",
        },
        {
          label: "Avg. Expense",
          value: `${avgPerExpense.toFixed(2)}`,
          sub: `per transaction · ${dashboard.summary.baseCurrency}`,
          icon: <FaCalendarAlt />,
          iconBg: "rgba(107,63,160,.12)",
          iconColor: "var(--purple)",
          glowColor: "var(--purple)",
        },
        {
          label: "Members",
          value: dashboard.group.members.length.toString(),
          sub: "in this group",
          icon: <FaUsers />,
          iconBg: "rgba(44,95,173,.12)",
          iconColor: "var(--blue)",
          glowColor: "var(--blue)",
        },
      ]
    : [];

  return (
    <div className="dp-wrap">
      <main className="dp-content">
        {/* Page toolbar */}
        <div className="dp-toolbar">
          <div className="dp-toolbar-left">
            <h1>Dashboard</h1>
            <p>Overview of your group expenses</p>
          </div>
          <div className="dp-toolbar-right">
            <select
              className="dp-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">— Select group —</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
            <button className="dp-add-btn" onClick={() => navigate("/expense")}>
              <FaPlus style={{ fontSize: 12 }} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Error (non-access-denied) */}
        {error && selectedGroup && error !== "Access denied" && (
          <div className="dp-state-card dp-error">
            <div className="dp-state-icon error">
              <FaExchangeAlt />
            </div>
            <div className="dp-state-title">Something went wrong</div>
            <p>{error}</p>
            <div className="dp-state-actions">
              <button className="dp-goto-btn" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="dp-state-card">
            <div className="dp-state-icon loading">
              <div className="dp-spinner" />
            </div>
            <div className="dp-state-title">Loading your dashboard</div>
            <p>Fetching the latest data from your group…</p>
          </div>
        )}

        {/* No group selected */}
        {!loading && !selectedGroup && (
          <div className="dp-state-card">
            <div className="dp-state-icon empty">
              <FaUserPlus />
            </div>
            <div className="dp-state-title">No group selected</div>
            <p>Select an existing group from the dropdown above, or create a new one to get started.</p>
            <div className="dp-state-actions">
              <button className="dp-goto-btn primary" onClick={() => navigate("/groups")}>
                <FaUsers /> Browse Groups
              </button>
            </div>
          </div>
        )}

        {/* Access denied */}
        {!loading && error === "Access denied" && selectedGroup && (
          <div className="dp-state-card">
            <div className="dp-state-icon locked">
              <FaLock />
            </div>
            <div className="dp-state-title">Access restricted</div>
            <p>You don't have permission to view this group. You may need to request access or join a different group.</p>
            <div className="dp-state-actions">
              <button className="dp-goto-btn primary" onClick={() => navigate("/groups")}>
                <FaUsers /> Go to Groups
              </button>
            </div>
          </div>
        )}

        {/* Dashboard content */}
        {!loading && dashboard && (
          <>
            {/* Metric cards */}
            <div className="dp-metrics">
              {metrics.map((m) => (
                <div className="dp-metric" key={m.label}>
                  <div className="dp-metric-glow" style={{ background: m.glowColor }} />
                  <div className="dp-metric-icon" style={{ background: m.iconBg, color: m.iconColor }}>
                    {m.icon}
                  </div>
                  <div className="dp-metric-label">{m.label}</div>
                  <div className="dp-metric-value">{m.value}</div>
                  <div className="dp-metric-sub">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Row 2: Top Spender + Monthly Trends */}
            <div className="dp-grid2">
              <div className="dp-card">
                <div className="dp-card-title">
                  <div className="dp-card-icon" style={{ background: "rgba(45,106,79,.12)", color: "var(--accent)" }}>
                    <FaTrophy />
                  </div>
                  Top Spender
                </div>
                {!dashboard.topSpender ? (
                  <p className="dp-empty">No spender data yet</p>
                ) : (
                  <div className="dp-spender-box">
                    <div className="dp-spender-avatar">
                      {dashboard.topSpender.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="dp-spender-name">{dashboard.topSpender.name}</div>
                      <div className="dp-spender-sub">Highest contributor</div>
                    </div>
                    <div className="dp-spender-amount">
                      {dashboard.topSpender.total.toFixed(2)}{" "}
                      <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "Epilogue" }}>
                        {dashboard.summary.baseCurrency}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="dp-card">
                <div className="dp-card-title">
                  <div className="dp-card-icon" style={{ background: "rgba(44,95,173,.12)", color: "var(--blue)" }}>
                    <FaChartLine />
                  </div>
                  Monthly Trends
                </div>
                {!dashboard.monthlyTrends?.length ? (
                  <p className="dp-empty">No monthly trend data yet</p>
                ) : (
                  dashboard.monthlyTrends.map((item) => (
                    <div className="dp-bar-row" key={item.month}>
                      <div className="dp-bar-month">{item.month}</div>
                      <div className="dp-bar-track">
                        <div
                          className="dp-bar-fill"
                          style={{ width: `${(item.total / maxMonthlyTotal) * 100}%` }}
                        />
                      </div>
                      <div className="dp-bar-val">{item.total.toFixed(0)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Row 3: Categories + Transactions + Activity */}
            <div className="dp-grid3">
              <div className="dp-card">
                <div className="dp-card-title">
                  <div className="dp-card-icon" style={{ background: "rgba(27,122,94,.12)", color: "var(--green)" }}>
                    <FaFire />
                  </div>
                  Categories
                </div>
                {!dashboard.categoryBreakdown.length ? (
                  <p className="dp-empty">No category data yet</p>
                ) : (
                  dashboard.categoryBreakdown.map((item) => (
                    <div className="dp-cat-row" key={item.category}>
                      <div className="dp-cat-header">
                        <span className="dp-cat-name">{item.category}</span>
                        <span className="dp-cat-val">
                          {item.total.toFixed(2)} {dashboard.summary.baseCurrency}
                        </span>
                      </div>
                      <div className="dp-cat-track">
                        <div
                          className="dp-cat-fill"
                          style={{ width: `${(item.total / topCategoryTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="dp-card">
                <div className="dp-card-title">
                  <div className="dp-card-icon" style={{ background: "rgba(107,63,160,.12)", color: "var(--purple)" }}>
                    <FaExchangeAlt />
                  </div>
                  Transactions
                </div>
                {!dashboard.recentTransactions.length ? (
                  <p className="dp-empty">No expenses yet</p>
                ) : (
                  dashboard.recentTransactions.map((item) => (
                    <div className="dp-tx-row" key={item._id}>
                      <div className="dp-tx-dot" />
                      <div className="dp-tx-info">
                        <div className="dp-tx-desc">{item.description || "Expense"}</div>
                        <div className="dp-tx-meta">
                          {item.category || "General"} · {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="dp-tx-amount">{item.amount} {item.currency}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="dp-card">
                <div className="dp-card-title">
                  <div className="dp-card-icon" style={{ background: "rgba(44,95,173,.12)", color: "var(--blue)" }}>
                    <FaCalendarAlt />
                  </div>
                  Activity Feed
                </div>
                {!dashboard.recentActivity?.length ? (
                  <p className="dp-empty">No activity yet</p>
                ) : (
                  dashboard.recentActivity.map((item, idx) => (
                    <div className="dp-activity-row" key={`${item.type}-${idx}`}>
                      <div className="dp-activity-line">
                        <div className="dp-activity-dot" />
                        {idx < dashboard.recentActivity!.length - 1 && (
                          <div className="dp-activity-connector" />
                        )}
                      </div>
                      <div className="dp-activity-body">
                        <div className="dp-activity-msg">{item.message}</div>
                        <div className="dp-activity-time">
                          {new Date(item.date).toLocaleString()}
                        </div>
                        <span className="dp-activity-badge">{item.type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
