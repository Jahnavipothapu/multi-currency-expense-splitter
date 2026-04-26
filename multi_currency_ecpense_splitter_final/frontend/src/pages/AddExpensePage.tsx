import { type FormEvent, useEffect, useMemo, useState } from "react";
import api from "../services/api";

type Group = { _id: string; name: string };
type Member = { _id: string; name: string };
type Expense = {
  _id: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  category?: string;
  splitType?: "equal" | "exact" | "percentage";
  splitEntries?: Array<{ userId: string; share: number; percentage?: number }>;
  description?: string;
  date: string;
  paidBy: { _id: string; name: string };
  participants: Array<{ _id: string; name: string }>;
  sharePerParticipant: number;
};

const categories = ["General", "Food", "Travel", "Stay", "Shopping", "Utilities", "Entertainment"];

const categoryIcons: Record<string, string> = {
  General: "📦",
  Food: "🍽️",
  Travel: "✈️",
  Stay: "🏨",
  Shopping: "🛍️",
  Utilities: "⚡",
  Entertainment: "🎬",
};

const currencySymbols: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const AddExpensePage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupId, setGroupId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paidBy, setPaidBy] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState("General");
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage">("equal");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  const [percentShares, setPercentShares] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    const loadGroupData = async () => {
      if (!groupId) return;
      try {
        const [groupResponse, expensesResponse] = await Promise.all([
          api.get("/groups/" + groupId),
          api.get(`/expenses/${groupId}?q=${encodeURIComponent(search)}&category=${encodeURIComponent(filterCategory)}&memberId=${encodeURIComponent(filterMember)}`),
        ]);
        const nextMembers: Member[] = groupResponse.data.group.members;
        setMembers(nextMembers);
        setExpenses(expensesResponse.data);
        if (!editingExpenseId) {
          const first = nextMembers[0]?._id || "";
          setPaidBy(first);
          setParticipants(nextMembers.map((m) => m._id));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load group data");
      }
    };
    loadGroupData();
  }, [groupId, editingExpenseId, search, filterCategory, filterMember]);

  const selectedCount = useMemo(() => participants.length, [participants]);

  const resetForm = () => {
    setEditingExpenseId("");
    setAmount("");
    setCurrency("USD");
    setCategory("General");
    setSplitType("equal");
    setExactShares({});
    setPercentShares({});
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    const first = members[0]?._id || "";
    setPaidBy(first);
    setParticipants(members.map((m) => m._id));
  };

  const submitExpense = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (participants.length === 0) { setError("Pick at least one participant."); return; }
    setSaving(true);
    try {
      const payload = {
        amount: Number(amount),
        currency,
        paidBy,
        participants,
        splitType,
        splitValues:
          splitType === "exact"
            ? Object.fromEntries(Object.entries(exactShares).map(([id, v]) => [id, Number(v || 0)]))
            : splitType === "percentage"
            ? Object.fromEntries(Object.entries(percentShares).map(([id, v]) => [id, Number(v || 0)]))
            : {},
        category,
        description: description.trim(),
        date,
      };
      if (editingExpenseId) {
        await api.put("/expenses/" + editingExpenseId, payload);
        setSuccess("Expense updated successfully.");
      } else {
        await api.post("/expenses", { ...payload, groupId });
        setSuccess("Expense saved. Balances updated.");
      }
      const refreshed = await api.get("/expenses/" + groupId);
      setExpenses(refreshed.data);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save expense");
    } finally {
      setSaving(false);
    }
  };

  const toggleParticipant = (memberId: string) => {
    setParticipants((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const startEdit = (expense: Expense) => {
    setEditingExpenseId(expense._id);
    setAmount(String(expense.amount));
    setCurrency(expense.currency);
    setCategory(expense.category || "General");
    setSplitType(expense.splitType || "equal");
    const nextExact: Record<string, string> = {};
    const nextPct: Record<string, string> = {};
    (expense.splitEntries || []).forEach((e) => {
      nextExact[e.userId] = String(e.share || 0);
      nextPct[e.userId] = String(e.percentage || 0);
    });
    setExactShares(nextExact);
    setPercentShares(nextPct);
    setDescription(expense.description || "");
    setDate(new Date(expense.date).toISOString().slice(0, 10));
    setPaidBy(expense.paidBy._id);
    setParticipants(expense.participants.map((p) => p._id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteExpense = async (expenseId: string) => {
    if (!window.confirm("Delete this expense?")) return;
    setSaving(true);
    try {
      await api.delete("/expenses/" + expenseId);
      const refreshed = await api.get("/expenses/" + groupId);
      setExpenses(refreshed.data);
      setSuccess("Expense deleted.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not delete expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .aep-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 20px 64px;
          color: #1a1f2e;
        }

        /* ── Two-column form layout ── */
        .aep-form-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 780px) {
          .aep-form-cols { grid-template-columns: 1fr; }
        }

        /* ── Page Header ── */
        .aep-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .aep-header-left {}
        .aep-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3d8c5f;
          margin: 0 0 6px;
        }
        .aep-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #1a1f2e;
          line-height: 1.2;
        }

        /* ── Group Selector ── */
        .aep-group-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f4f6f3;
          border: 1.5px solid #e2e8df;
          border-radius: 12px;
          padding: 8px 14px;
        }
        .aep-group-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          white-space: nowrap;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .aep-group-select {
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

        /* ── Panel Card ── */
        .aep-panel {
          background: #ffffff;
          border: 1.5px solid #e8ede6;
          border-radius: 20px;
          padding: 28px 28px 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(30,50,30,0.05);
        }
        .aep-panel-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a1f2e;
          margin: 0 0 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .aep-panel-title-dot {
          width: 8px;
          height: 8px;
          background: #3d8c5f;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Form Grid ── */
        .aep-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .aep-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 560px) {
          .aep-grid-2, .aep-grid-3 { grid-template-columns: 1fr; }
          .aep-panel { padding: 20px 16px; }
        }

        /* ── Field ── */
        .aep-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .aep-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .aep-input, .aep-select {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1a1f2e;
          background: #f7f9f7;
          border: 1.5px solid #e2e8df;
          border-radius: 10px;
          padding: 10px 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .aep-input:focus, .aep-select:focus {
          border-color: #3d8c5f;
          box-shadow: 0 0 0 3px rgba(61,140,95,0.12);
          background: #fff;
        }
        .aep-input::placeholder { color: #b0b8b0; }

        /* Amount field with currency prefix */
        .aep-amount-wrap {
          position: relative;
        }
        .aep-amount-prefix {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 500;
          color: #3d8c5f;
          pointer-events: none;
          line-height: 1;
        }
        .aep-amount-input {
          padding-left: 28px !important;
          font-family: 'DM Mono', monospace !important;
          font-size: 20px !important;
          font-weight: 500 !important;
          color: #1a1f2e !important;
        }

        /* ── Category Pills ── */
        .aep-category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 2px;
        }
        .aep-cat-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
          border: 1.5px solid #e2e8df;
          background: #f7f9f7;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .aep-cat-pill:hover { border-color: #3d8c5f; color: #3d8c5f; }
        .aep-cat-pill.active {
          background: #3d8c5f;
          border-color: #3d8c5f;
          color: #fff;
        }

        /* ── Split Type Tabs ── */
        .aep-split-tabs {
          display: flex;
          background: #f4f6f3;
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .aep-split-tab {
          flex: 1;
          text-align: center;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .aep-split-tab.active {
          background: #fff;
          color: #1a1f2e;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* ── Participants ── */
        .aep-participants-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .aep-participant-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px 7px 10px;
          border-radius: 50px;
          border: 1.5px solid #e2e8df;
          background: #f7f9f7;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 13.5px;
          font-weight: 500;
          color: #6b7280;
          user-select: none;
        }
        .aep-participant-chip:hover { border-color: #3d8c5f; }
        .aep-participant-chip.selected {
          background: #edf7f1;
          border-color: #3d8c5f;
          color: #1a1f2e;
        }
        .aep-participant-check {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #d0d8d0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
          font-size: 10px;
        }
        .aep-participant-chip.selected .aep-participant-check {
          background: #3d8c5f;
          border-color: #3d8c5f;
          color: #fff;
        }
        .aep-participant-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3d8c5f, #5aad7a);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Split Shares Panel ── */
        .aep-shares-panel {
          background: #f7faf8;
          border: 1.5px solid #d8eddf;
          border-radius: 14px;
          padding: 16px 18px;
          margin-top: 4px;
        }
        .aep-shares-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #3d8c5f;
          margin: 0 0 14px;
        }
        .aep-share-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .aep-share-row:last-child { margin-bottom: 0; }
        .aep-share-name {
          flex: 1;
          font-size: 13.5px;
          font-weight: 500;
          color: #374151;
        }
        .aep-share-input {
          width: 110px;
          text-align: right;
          font-family: 'DM Mono', monospace;
        }
        .aep-share-suffix {
          font-size: 13px;
          color: #6b7280;
          width: 18px;
        }

        /* ── Alerts ── */
        .aep-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 500;
          margin-top: 4px;
        }
        .aep-alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }
        .aep-alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }
        .aep-alert-icon { font-size: 16px; flex-shrink: 0; }

        /* ── Empty State ── */
        .aep-empty-state {
          text-align: center;
          padding: 28px 20px;
          color: #9ca3af;
        }
        .aep-empty-icon { font-size: 36px; margin-bottom: 12px; }
        .aep-empty-text { font-size: 14px; font-weight: 500; }

        /* ── Buttons ── */
        .aep-btn-row {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .aep-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 22px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          border: none;
          outline: none;
        }
        .aep-btn-primary {
          background: #2d7a52;
          color: #fff;
          box-shadow: 0 2px 10px rgba(45,122,82,0.28);
        }
        .aep-btn-primary:hover:not(:disabled) {
          background: #236643;
          box-shadow: 0 4px 16px rgba(45,122,82,0.38);
          transform: translateY(-1px);
        }
        .aep-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .aep-btn-secondary {
          background: #f4f6f3;
          color: #374151;
          border: 1.5px solid #e2e8df;
        }
        .aep-btn-secondary:hover { background: #e8ede6; }
        .aep-btn-danger {
          background: #fff0f0;
          color: #dc2626;
          border: 1.5px solid #fecaca;
          padding: 7px 13px;
          font-size: 12.5px;
        }
        .aep-btn-danger:hover { background: #fee2e2; }
        .aep-btn-edit {
          background: #f0f9ff;
          color: #0369a1;
          border: 1.5px solid #bae6fd;
          padding: 7px 13px;
          font-size: 12.5px;
        }
        .aep-btn-edit:hover { background: #e0f2fe; }

        /* ── Expense List ── */
        .aep-expense-list { display: flex; flex-direction: column; gap: 10px; }
        .aep-expense-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #f9fbf9;
          border: 1.5px solid #e8ede6;
          border-radius: 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .aep-expense-item:hover {
          border-color: #c5deca;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .aep-expense-cat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #edf7f1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .aep-expense-info { flex: 1; min-width: 0; }
        .aep-expense-name {
          font-size: 14.5px;
          font-weight: 600;
          color: #1a1f2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .aep-expense-meta {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .aep-expense-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .aep-expense-amount {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 600;
          color: #1a1f2e;
          min-width: 80px;
          text-align: right;
        }
        .aep-expense-share {
          font-size: 11px;
          color: #6b7280;
          font-family: 'DM Mono', monospace;
          margin-top: 2px;
          text-align: right;
        }

        /* ── Filters ── */
        .aep-filter-row {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .aep-search-wrap {
          flex: 1;
          min-width: 160px;
          position: relative;
        }
        .aep-search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 14px;
          pointer-events: none;
        }
        .aep-search-input {
          padding-left: 32px !important;
        }
        .aep-filter-select { min-width: 130px; }
        .aep-section-divider {
          height: 1px;
          background: linear-gradient(to right, #e8ede6, transparent);
          margin: 20px 0;
        }
        .aep-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          background: #3d8c5f;
          color: #fff;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          padding: 0 5px;
          margin-left: 6px;
        }
      `}</style>

      <div className="aep-root">
        {/* ── Header ── */}
        <div className="aep-header">
          <div className="aep-header-left">
            <p className="aep-eyebrow">Expense Tracker</p>
            <h1 className="aep-title">
              {editingExpenseId ? "✏️ Edit Expense" : "➕ Add Expense"}
            </h1>
          </div>
          <div className="aep-group-bar">
            <span className="aep-group-label">Group</span>
            <select
              className="aep-group-select"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
            >
              <option value="">Select group…</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Empty / Access denied states ── */}
        {!loading && !groupId && (
          <div className="aep-panel" style={{ textAlign: "center", padding: "40px 28px" }}>
            <div className="aep-empty-icon">👥</div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No group selected</p>
            <p className="aep-empty-text" style={{ marginBottom: 20 }}>
              Select, join, or create a group to start tracking expenses.
            </p>
            <button className="aep-btn aep-btn-primary" onClick={() => window.location.href = "/groups"}>
              Browse Groups
            </button>
          </div>
        )}

        {!loading && error === "Access denied" && groupId && (
          <div className="aep-panel" style={{ textAlign: "center", padding: "40px 28px" }}>
            <div className="aep-empty-icon">🔒</div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Access Denied</p>
            <p className="aep-empty-text" style={{ marginBottom: 20 }}>
              You don't have access to this group.
            </p>
            <button className="aep-btn aep-btn-primary" onClick={() => window.location.href = "/groups"}>
              Go to Groups
            </button>
          </div>
        )}

        {/* ── Expense Form ── */}
        {(groupId && error !== "Access denied") && (
          <form onSubmit={submitExpense}>
            <div className="aep-form-cols">
              {/* LEFT — Expense Details */}
              <div className="aep-panel" style={{ marginBottom: 0 }}>
                <p className="aep-panel-title">
                  <span className="aep-panel-title-dot" />
                  Expense Details
                </p>

                <div className="aep-grid-3" style={{ marginBottom: 14 }}>
                  <div className="aep-field" style={{ gridColumn: "1/3" }}>
                    <label className="aep-label">Amount</label>
                    <div className="aep-amount-wrap">
                      <span className="aep-amount-prefix">{currencySymbols[currency] || currency}</span>
                      <input
                        className="aep-input aep-amount-input"
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={amount} onChange={(e) => setAmount(e.target.value)} required
                      />
                    </div>
                  </div>
                  <div className="aep-field">
                    <label className="aep-label">Currency</label>
                    <select className="aep-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      {Object.keys(currencySymbols).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="aep-grid-2" style={{ marginBottom: 14 }}>
                  <div className="aep-field">
                    <label className="aep-label">Description</label>
                    <input className="aep-input" placeholder="e.g. Dinner at Spice Garden"
                      value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="aep-field">
                    <label className="aep-label">Date</label>
                    <input className="aep-input" type="date" value={date}
                      onChange={(e) => setDate(e.target.value)} required />
                  </div>
                </div>

                <div className="aep-section-divider" />

                <div className="aep-field">
                  <label className="aep-label">Category</label>
                  <div className="aep-category-pills">
                    {categories.map((cat) => (
                      <button key={cat} type="button"
                        className={`aep-cat-pill${category === cat ? " active" : ""}`}
                        onClick={() => setCategory(cat)}
                      >
                        <span>{categoryIcons[cat]}</span>{cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — Split Settings */}
              <div className="aep-panel" style={{ marginBottom: 0 }}>
                <p className="aep-panel-title">
                  <span className="aep-panel-title-dot" />
                  Split Settings
                </p>

                <div className="aep-field" style={{ marginBottom: 14 }}>
                  <label className="aep-label">Split Type</label>
                  <div className="aep-split-tabs">
                    {(["equal", "exact", "percentage"] as const).map((type) => (
                      <button key={type} type="button"
                        className={`aep-split-tab${splitType === type ? " active" : ""}`}
                        onClick={() => setSplitType(type)}
                      >
                        {type === "equal" ? "⚖️ Equal" : type === "exact" ? "🔢 Exact" : "📊 Percent"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="aep-field" style={{ marginBottom: 14 }}>
                  <label className="aep-label">Paid By</label>
                  <select className="aep-select" value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)} required>
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="aep-field">
                  <label className="aep-label">
                    Participants <span className="aep-count-badge">{selectedCount}</span>
                  </label>
                  <div className="aep-participants-grid" style={{ marginTop: 4 }}>
                    {members.map((m) => {
                      const sel = participants.includes(m._id);
                      return (
                        <div key={m._id}
                          className={`aep-participant-chip${sel ? " selected" : ""}`}
                          onClick={() => toggleParticipant(m._id)}
                        >
                          <div className="aep-participant-check">{sel && "✓"}</div>
                          <div className="aep-participant-avatar">{m.name.charAt(0).toUpperCase()}</div>
                          {m.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {splitType !== "equal" && (
                  <div className="aep-shares-panel" style={{ marginTop: 14 }}>
                    <p className="aep-shares-title">
                      {splitType === "exact" ? "Exact Amounts (base currency)" : "Percentage per Person"}
                    </p>
                    {participants.map((memberId) => {
                      const mName = members.find((m) => m._id === memberId)?.name || "Member";
                      const val = splitType === "exact" ? (exactShares[memberId] || "") : (percentShares[memberId] || "");
                      return (
                        <div key={memberId} className="aep-share-row">
                          <div className="aep-participant-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                            {mName.charAt(0)}
                          </div>
                          <span className="aep-share-name">{mName}</span>
                          <input className="aep-input aep-share-input" type="number" step="0.01" placeholder="0"
                            value={val}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (splitType === "exact") setExactShares((p) => ({ ...p, [memberId]: v }));
                              else setPercentShares((p) => ({ ...p, [memberId]: v }));
                            }}
                          />
                          <span className="aep-share-suffix">
                            {splitType === "percentage" ? "%" : currencySymbols[currency]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Alerts inside right column */}
                {error && groupId && error !== "Access denied" && (
                  <div className="aep-alert aep-alert-error" style={{ marginTop: 14 }}>
                    <span className="aep-alert-icon">⚠️</span>{error}
                  </div>
                )}
                {success && (
                  <div className="aep-alert aep-alert-success" style={{ marginTop: 14 }}>
                    <span className="aep-alert-icon">✅</span>{success}
                  </div>
                )}

                {/* Action Buttons inside right column */}
                <div className="aep-btn-row" style={{ marginTop: 16 }}>
                  <button className="aep-btn aep-btn-primary" type="submit" disabled={saving || loading}>
                    {saving ? "⏳ Saving…" : editingExpenseId ? "✏️ Update Expense" : "💾 Save Expense"}
                  </button>
                  {editingExpenseId && (
                    <button className="aep-btn aep-btn-secondary" type="button" onClick={resetForm}>
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── Expense History ── */}
        {groupId && error !== "Access denied" && (
          <div className="aep-panel" style={{ marginTop: 18 }}>
            <p className="aep-panel-title">
              <span className="aep-panel-title-dot" />
              Expense History
              {expenses.length > 0 && (
                <span className="aep-count-badge">{expenses.length}</span>
              )}
            </p>

            {/* Filters */}
            <div className="aep-filter-row">
              <div className="aep-search-wrap">
                <span className="aep-search-icon">🔍</span>
                <input
                  className="aep-input aep-search-input"
                  placeholder="Search description…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="aep-select aep-filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{categoryIcons[c]} {c}</option>
                ))}
              </select>
              <select
                className="aep-select aep-filter-select"
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
              >
                <option value="">All members</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              {(search || filterCategory || filterMember) && (
                <button
                  className="aep-btn aep-btn-secondary"
                  type="button"
                  style={{ padding: "9px 14px", fontSize: 13 }}
                  onClick={() => { setSearch(""); setFilterCategory(""); setFilterMember(""); }}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* List */}
            {expenses.length === 0 ? (
              <div className="aep-empty-state">
                <div className="aep-empty-icon">💸</div>
                <p className="aep-empty-text">No expenses yet. Add one above!</p>
              </div>
            ) : (
              <div className="aep-expense-list">
                {expenses.map((expense) => (
                  <div key={expense._id} className="aep-expense-item">
                    <div className="aep-expense-cat-icon">
                      {categoryIcons[expense.category || "General"]}
                    </div>
                    <div className="aep-expense-info">
                      <div className="aep-expense-name">
                        {expense.description || "Expense"}
                      </div>
                      <div className="aep-expense-meta">
                        {expense.category || "General"} · {expense.splitType || "equal"} split · paid by {expense.paidBy.name} · {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="aep-expense-right">
                      <div>
                        <div className="aep-expense-amount">
                          {currencySymbols[expense.currency] || ""}{expense.amount.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>{expense.currency}</span>
                        </div>
                        <div className="aep-expense-share">
                          ÷ {expense.sharePerParticipant.toFixed(2)} {expense.baseCurrency}
                        </div>
                      </div>
                      <button className="aep-btn aep-btn-edit" type="button" onClick={() => startEdit(expense)}>
                        Edit
                      </button>
                      <button className="aep-btn aep-btn-danger" type="button" onClick={() => deleteExpense(expense._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AddExpensePage;