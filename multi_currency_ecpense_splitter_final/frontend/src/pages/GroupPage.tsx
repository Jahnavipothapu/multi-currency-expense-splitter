import { type FormEvent, useEffect, useState } from "react";
import api from "../services/api";

type Group = { _id: string; name: string; joinCode: string; baseCurrency: string; myRole?: string; inviteLink?: string };
type GroupMember = { _id: string; name: string; email: string; role: "admin" | "member" };

const avatarColor = (name: string) => {
  const colors = ["#3d8c5f", "#2563eb", "#7c3aed", "#db2777", "#d97706", "#0891b2"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const currencyFlags: Record<string, string> = { USD: "🇺🇸", INR: "🇮🇳", EUR: "🇪🇺", GBP: "🇬🇧" };

const GroupPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupName, setGroupName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [joinCode, setJoinCode] = useState("");
  const [settingsName, setSettingsName] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualStatus, setManualStatus] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "settings">("members");
  const [leftTab, setLeftTab] = useState<"create" | "join">("create");

  const loadGroups = async () => {
    const response = await api.get("/groups");
    setGroups(response.data);
    const active = localStorage.getItem("activeGroupId") || response.data[0]?._id || "";
    setSelectedGroupId(active);
  };

  const loadGroupMembers = async (groupId: string) => {
    if (!groupId) return;
    const response = await api.get(`/groups/${groupId}`);
    setGroupMembers(response.data.group.members);
    setSettingsName(response.data.group.name);
    setSettingsCurrency(response.data.group.baseCurrency);
  };

  useEffect(() => {
    const init = async () => {
      try { await loadGroups(); }
      catch (err: any) { setError(err.response?.data?.message || "Could not load groups"); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("joinCode");
    if (inviteCode) { setJoinCode(inviteCode); setLeftTab("join"); }
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem("activeGroupId", selectedGroupId);
      loadGroupMembers(selectedGroupId).catch(() => {});
    }
  }, [selectedGroupId]);

  const createGroup = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await api.post("/groups", { name: groupName.trim(), baseCurrency });
      setGroupName("");
      await loadGroups();
      setSuccess("Group created successfully.");
    } catch (err: any) { setError(err.response?.data?.message || "Could not create group"); }
    finally { setSaving(false); }
  };

  const joinGroup = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await api.post("/groups/join", { joinCode: joinCode.trim().toUpperCase() });
      setJoinCode("");
      await loadGroups();
      setSuccess("Joined group successfully.");
    } catch (err: any) { setError(err.response?.data?.message || "Could not join group"); }
    finally { setSaving(false); }
  };

  const selectedGroup = groups.find((item) => item._id === selectedGroupId);

  const updateSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.put(`/groups/${selectedGroupId}`, { name: settingsName, baseCurrency: settingsCurrency });
      await loadGroups(); await loadGroupMembers(selectedGroupId);
      setSuccess("Group settings updated.");
    } catch (err: any) { setError(err.response?.data?.message || "Could not update group settings"); }
    finally { setSaving(false); }
  };

  const removeMember = async (memberId: string) => {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await api.delete(`/groups/${selectedGroupId}/members/${memberId}`);
      await loadGroupMembers(selectedGroupId);
      setSuccess("Member removed.");
    } catch (err: any) { setError(err.response?.data?.message || "Could not remove member"); }
    finally { setSaving(false); }
  };

  const changeRole = async (memberId: string, role: "admin" | "member") => {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await api.put(`/groups/${selectedGroupId}/members/${memberId}/role`, { role });
      await loadGroupMembers(selectedGroupId);
      setSuccess("Member role updated.");
    } catch (err: any) { setError(err.response?.data?.message || "Could not update role"); }
    finally { setSaving(false); }
  };

  const inviteMember = async (e: FormEvent) => {
    e.preventDefault(); setInviteStatus("");
    if (!inviteEmail || !selectedGroupId) return;
    try {
      await api.post(`/groups/${selectedGroupId}/invite`, { email: inviteEmail });
      setInviteStatus("✅ Invitation sent!"); setInviteEmail("");
      await loadGroupMembers(selectedGroupId);
    } catch (err: any) { setInviteStatus(err.response?.data?.message || "Could not invite member"); }
  };

  const addMemberManually = async (e: FormEvent) => {
    e.preventDefault(); setManualStatus("");
    if (!manualName || !selectedGroupId) return;
    try {
      await api.post(`/groups/${selectedGroupId}/members`, { name: manualName, email: manualEmail });
      setManualStatus("✅ Member added!"); setManualName(""); setManualEmail("");
      await loadGroupMembers(selectedGroupId);
    } catch (err: any) { setManualStatus(err.response?.data?.message || "Could not add member"); }
  };

  const deleteCurrentGroup = async () => {
    if (!selectedGroupId) return;
    if (!window.confirm("Delete this group permanently?")) return;
    setSaving(true);
    try {
      await api.delete(`/groups/${selectedGroupId}`);
      await loadGroups(); setSuccess("Group deleted."); setSelectedGroupId("");
    } catch (err: any) { setError(err.response?.data?.message || "Could not delete group"); }
    finally { setSaving(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .gp-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 20px 60px;
          color: #1a1f2e;
        }

        /* Header */
        .gp-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: #3d8c5f; margin: 0 0 4px;
        }
        .gp-title { font-size: 26px; font-weight: 700; margin: 0 0 20px; color: #1a1f2e; }

        /* Alerts */
        .gp-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; border-radius: 12px;
          font-size: 13.5px; font-weight: 500; margin-bottom: 16px;
        }
        .gp-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .gp-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }

        /* ── MAIN TWO-COLUMN LAYOUT ── */
        .gp-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 820px) { .gp-layout { grid-template-columns: 1fr; } }

        /* Panel */
        .gp-panel {
          background: #fff; border: 1.5px solid #e8ede6;
          border-radius: 20px; padding: 20px 20px 18px;
          box-shadow: 0 2px 12px rgba(30,50,30,0.04);
        }
        .gp-panel-title {
          font-size: 13.5px; font-weight: 700; color: #1a1f2e;
          display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
        }
        .gp-panel-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #3d8c5f; flex-shrink: 0;
        }

        /* ── LEFT COLUMN ── */
        .gp-left { display: flex; flex-direction: column; gap: 14px; }

        /* Mini tabs inside left col */
        .gp-mini-tabs {
          display: flex; background: #f4f6f3;
          border-radius: 10px; padding: 3px; gap: 2px; margin-bottom: 16px;
        }
        .gp-mini-tab {
          flex: 1; text-align: center; padding: 7px 8px;
          font-size: 12.5px; font-weight: 500; border-radius: 8px;
          cursor: pointer; color: #6b7280; border: none;
          background: transparent; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .gp-mini-tab.active {
          background: #fff; color: #1a1f2e; font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* Fields */
        .gp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 11px; }
        .gp-field:last-of-type { margin-bottom: 0; }
        .gp-label {
          font-size: 10.5px; font-weight: 700; color: #6b7280;
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .gp-input {
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1f2e;
          background: #f7f9f7; border: 1.5px solid #e2e8df; border-radius: 10px;
          padding: 9px 13px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%; box-sizing: border-box;
        }
        .gp-input:focus {
          border-color: #3d8c5f; box-shadow: 0 0 0 3px rgba(61,140,95,0.12); background: #fff;
        }
        .gp-input::placeholder { color: #b0b8b0; }
        .gp-input[readonly] {
          background: #f4f6f3; color: #6b7280; cursor: default;
          font-family: 'DM Mono', monospace; font-size: 12px;
        }

        /* Currency pills */
        .gp-currency-row { display: flex; gap: 6px; }
        .gp-currency-opt {
          flex: 1; padding: 7px 4px; border: 1.5px solid #e2e8df; border-radius: 9px;
          background: #f7f9f7; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600; color: #6b7280;
          cursor: pointer; text-align: center; transition: all 0.15s;
        }
        .gp-currency-opt:hover { border-color: #3d8c5f; }
        .gp-currency-opt.active { background: #edf7f1; border-color: #3d8c5f; color: #1a1f2e; }

        /* Buttons */
        .gp-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px 18px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; border: none; outline: none;
          width: 100%; box-sizing: border-box;
        }
        .gp-btn-primary {
          background: #2d7a52; color: #fff;
          box-shadow: 0 2px 8px rgba(45,122,82,0.25); margin-top: 8px;
        }
        .gp-btn-primary:hover:not(:disabled) { background: #236643; transform: translateY(-1px); }
        .gp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .gp-btn-secondary {
          background: #f4f6f3; color: #374151;
          border: 1.5px solid #e2e8df; margin-top: 6px;
        }
        .gp-btn-secondary:hover { background: #e8ede6; }
        .gp-btn-danger {
          background: #fff0f0; color: #dc2626;
          border: 1.5px solid #fecaca; margin-top: 6px;
        }
        .gp-btn-danger:hover { background: #fee2e2; }
        .gp-btn-sm { padding: 6px 11px; font-size: 12px; width: auto; border-radius: 8px; }

        /* Groups list */
        .gp-groups-list { display: flex; flex-direction: column; gap: 8px; }
        .gp-group-item {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px; background: #f9fbf9;
          border: 1.5px solid #e8ede6; border-radius: 13px;
          transition: all 0.15s; cursor: pointer;
        }
        .gp-group-item:hover { border-color: #3d8c5f; box-shadow: 0 2px 6px rgba(61,140,95,0.1); }
        .gp-group-item.active { border-color: #3d8c5f; background: #edf7f1; }
        .gp-group-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; background: #edf7f1;
        }
        .gp-group-info { flex: 1; min-width: 0; }
        .gp-group-name { font-size: 13.5px; font-weight: 700; color: #1a1f2e; }
        .gp-group-meta { font-size: 11px; color: #9ca3af; margin-top: 1px; }
        .gp-join-code {
          font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 600;
          background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;
          border-radius: 6px; padding: 3px 8px; cursor: pointer;
          transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .gp-join-code:hover { background: #e0f2fe; }
        .gp-join-code.copied { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }

        /* Loading */
        .gp-loading {
          display: flex; align-items: center; gap: 10px;
          padding: 24px; color: #9ca3af; font-size: 13px; justify-content: center;
        }
        .gp-spinner {
          width: 16px; height: 16px; border: 2px solid #e2e8df;
          border-top-color: #3d8c5f; border-radius: 50%;
          animation: gp-spin 0.7s linear infinite;
        }
        @keyframes gp-spin { to { transform: rotate(360deg); } }

        /* Empty */
        .gp-empty { text-align: center; padding: 24px 16px; color: #9ca3af; }
        .gp-empty-icon { font-size: 30px; margin-bottom: 8px; }
        .gp-empty-text { font-size: 13px; font-weight: 500; }

        /* ── RIGHT COLUMN ── */
        .gp-right { display: flex; flex-direction: column; gap: 0; }

        /* No selection state */
        .gp-no-selection {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 20px; color: #9ca3af;
          text-align: center;
        }
        .gp-no-selection-icon { font-size: 40px; margin-bottom: 12px; }
        .gp-no-selection-text { font-size: 14px; font-weight: 500; }

        /* Detail panel header */
        .gp-detail-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .gp-detail-name {
          font-size: 18px; font-weight: 700; color: #1a1f2e;
          display: flex; align-items: center; gap: 8px;
        }
        .gp-role-badge {
          font-size: 10.5px; font-weight: 700; padding: 3px 9px;
          border-radius: 50px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .gp-role-admin { background: #fef3c7; color: #d97706; }
        .gp-role-member { background: #f3f4f6; color: #6b7280; }

        /* Tabs */
        .gp-tabs {
          display: flex; background: #f4f6f3;
          border-radius: 10px; padding: 3px; gap: 2px; margin-bottom: 18px;
        }
        .gp-tab {
          flex: 1; text-align: center; padding: 8px 10px;
          font-size: 13px; font-weight: 500; border-radius: 8px;
          cursor: pointer; color: #6b7280; border: none;
          background: transparent; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .gp-tab.active {
          background: #fff; color: #1a1f2e; font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* Add member sections */
        .gp-add-section {
          background: #f7faf8; border: 1.5px solid #d8eddf;
          border-radius: 13px; padding: 14px 16px; margin-bottom: 14px;
        }
        .gp-add-section-title {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #3d8c5f; margin: 0 0 10px;
        }
        .gp-inline-row { display: flex; gap: 8px; align-items: flex-start; }
        .gp-status-msg { font-size: 12px; margin-top: 7px; font-weight: 500; }
        .gp-status-ok { color: #16a34a; }
        .gp-status-err { color: #dc2626; }

        /* Members list */
        .gp-member-row {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 0; border-bottom: 1px solid #f3f4f6;
        }
        .gp-member-row:last-child { border-bottom: none; padding-bottom: 0; }
        .gp-member-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .gp-member-info { flex: 1; min-width: 0; }
        .gp-member-name { font-size: 13.5px; font-weight: 600; color: #1a1f2e; }
        .gp-member-email { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
        .gp-member-actions { display: flex; gap: 5px; flex-shrink: 0; align-items: center; }

        /* Divider */
        .gp-divider { height: 1px; background: linear-gradient(to right, #e8ede6, transparent); margin: 14px 0; }

        /* Scrollable right panel content */
        .gp-right-scroll { max-height: calc(100vh - 200px); overflow-y: auto; }
        .gp-right-scroll::-webkit-scrollbar { width: 4px; }
        .gp-right-scroll::-webkit-scrollbar-track { background: transparent; }
        .gp-right-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>

      <div className="gp-root">
        <p className="gp-eyebrow">Manage Groups</p>
        <h1 className="gp-title">Groups</h1>

        {error && <div className="gp-alert gp-alert-error">⚠️ {error}</div>}
        {success && <div className="gp-alert gp-alert-success">✅ {success}</div>}

        {/* ── MAIN LAYOUT ── */}
        <div className="gp-layout">

          {/* ── LEFT COLUMN ── */}
          <div className="gp-left">

            {/* Create / Join tabs */}
            <div className="gp-panel">
              <div className="gp-mini-tabs">
                <button className={`gp-mini-tab${leftTab === "create" ? " active" : ""}`}
                  onClick={() => setLeftTab("create")}>🏠 Create Group</button>
                <button className={`gp-mini-tab${leftTab === "join" ? " active" : ""}`}
                  onClick={() => setLeftTab("join")}>🔗 Join Group</button>
              </div>

              {leftTab === "create" && (
                <form onSubmit={createGroup}>
                  <div className="gp-field">
                    <label className="gp-label">Group Name</label>
                    <input className="gp-input" value={groupName} placeholder="e.g. Goa Trip 2026"
                      onChange={(e) => setGroupName(e.target.value)} minLength={2} required />
                  </div>
                  <div className="gp-field">
                    <label className="gp-label">Base Currency</label>
                    <div className="gp-currency-row">
                      {["USD", "INR", "EUR", "GBP"].map((c) => (
                        <button key={c} type="button"
                          className={`gp-currency-opt${baseCurrency === c ? " active" : ""}`}
                          onClick={() => setBaseCurrency(c)}>
                          {currencyFlags[c]} {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="gp-btn gp-btn-primary" disabled={saving} type="submit">
                    {saving ? "Creating…" : "Create Group"}
                  </button>
                </form>
              )}

              {leftTab === "join" && (
                <form onSubmit={joinGroup}>
                  <div className="gp-field">
                    <label className="gp-label">Invite Code</label>
                    <input className="gp-input" value={joinCode} placeholder="Enter 6-digit code"
                      onChange={(e) => setJoinCode(e.target.value)} required />
                  </div>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>
                    Ask a group admin for the join code, or click an invite link.
                  </p>
                  <button className="gp-btn gp-btn-primary" disabled={saving} type="submit">
                    {saving ? "Joining…" : "Join Group"}
                  </button>
                </form>
              )}
            </div>

            {/* Groups list */}
            <div className="gp-panel">
              <p className="gp-panel-title">
                <span className="gp-panel-dot" />
                Your Groups
                {groups.length > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, background: "#edf7f1", color: "#3d8c5f", borderRadius: 50, padding: "2px 7px", marginLeft: 4 }}>
                    {groups.length}
                  </span>
                )}
              </p>

              {loading ? (
                <div className="gp-loading"><div className="gp-spinner" /> Loading…</div>
              ) : groups.length === 0 ? (
                <div className="gp-empty">
                  <div className="gp-empty-icon">👥</div>
                  <p className="gp-empty-text">No groups yet. Create one or join!</p>
                </div>
              ) : (
                <div className="gp-groups-list">
                  {groups.map((group) => (
                    <div key={group._id}
                      className={`gp-group-item${selectedGroupId === group._id ? " active" : ""}`}
                      onClick={() => setSelectedGroupId(group._id)}>
                      <div className="gp-group-icon">
                        {selectedGroupId === group._id ? "📂" : "📁"}
                      </div>
                      <div className="gp-group-info">
                        <div className="gp-group-name">{group.name}</div>
                        <div className="gp-group-meta">
                          {currencyFlags[group.baseCurrency]} {group.baseCurrency}
                          {group.myRole === "admin" && " · Admin"}
                        </div>
                      </div>
                      <span className={`gp-join-code${copiedCode === group.joinCode ? " copied" : ""}`}
                        onClick={(e) => { e.stopPropagation(); copyCode(group.joinCode); }}
                        title="Click to copy">
                        {copiedCode === group.joinCode ? "✓ Copied" : `# ${group.joinCode}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="gp-right">
            <div className="gp-panel">
              {!selectedGroup ? (
                <div className="gp-no-selection">
                  <div className="gp-no-selection-icon">📂</div>
                  <p className="gp-no-selection-text">Select a group on the left to view members and settings.</p>
                </div>
              ) : (
                <div className="gp-right-scroll">
                  {/* Detail header */}
                  <div className="gp-detail-header">
                    <div className="gp-detail-name">
                      <span>📂</span>
                      {selectedGroup.name}
                      {selectedGroup.myRole === "admin" && (
                        <span className="gp-role-badge gp-role-admin">Admin</span>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="gp-tabs">
                    <button className={`gp-tab${activeTab === "members" ? " active" : ""}`}
                      onClick={() => setActiveTab("members")}>
                      👥 Members ({groupMembers.length})
                    </button>
                    <button className={`gp-tab${activeTab === "settings" ? " active" : ""}`}
                      onClick={() => setActiveTab("settings")}>
                      ⚙️ Settings
                    </button>
                  </div>

                  {/* Members Tab */}
                  {activeTab === "members" && (
                    <>
                      {selectedGroup.myRole === "admin" && (
                        <>
                          {/* Invite by email */}
                          <div className="gp-add-section">
                            <p className="gp-add-section-title">✉️ Invite by Email</p>
                            <form onSubmit={inviteMember}>
                              <div className="gp-inline-row">
                                <input className="gp-input" type="email" placeholder="friend@email.com"
                                  value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
                                  style={{ flex: 1 }} />
                                <button className="gp-btn gp-btn-primary gp-btn-sm" type="submit"
                                  disabled={saving || !inviteEmail}
                                  style={{ marginTop: 0, flexShrink: 0, whiteSpace: "nowrap" }}>
                                  Send Invite
                                </button>
                              </div>
                              {inviteStatus && (
                                <p className={`gp-status-msg ${inviteStatus.startsWith("✅") ? "gp-status-ok" : "gp-status-err"}`}>
                                  {inviteStatus}
                                </p>
                              )}
                            </form>
                          </div>

                          {/* Add manually */}
                          <div className="gp-add-section">
                            <p className="gp-add-section-title">➕ Add Member Manually</p>
                            <form onSubmit={addMemberManually}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                <input className="gp-input" type="text" placeholder="Full name"
                                  value={manualName} onChange={(e) => setManualName(e.target.value)} required />
                                <input className="gp-input" type="email" placeholder="Email address"
                                  value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} required />
                              </div>
                              <button className="gp-btn gp-btn-secondary gp-btn-sm"
                                type="submit" disabled={saving || !manualName || !manualEmail}
                                style={{ width: "auto", marginTop: 0 }}>
                                Add Member
                              </button>
                              {manualStatus && (
                                <p className={`gp-status-msg ${manualStatus.startsWith("✅") ? "gp-status-ok" : "gp-status-err"}`}>
                                  {manualStatus}
                                </p>
                              )}
                            </form>
                          </div>
                        </>
                      )}

                      {/* Members list */}
                      {groupMembers.length === 0 ? (
                        <div className="gp-empty" style={{ padding: "16px" }}>
                          <p className="gp-empty-text">No members loaded.</p>
                        </div>
                      ) : (
                        groupMembers.map((member) => (
                          <div key={member._id} className="gp-member-row">
                            <div className="gp-member-avatar" style={{ background: avatarColor(member.name) }}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="gp-member-info">
                              <div className="gp-member-name">{member.name}</div>
                              <div className="gp-member-email">{member.email}</div>
                            </div>
                            <span className={`gp-role-badge ${member.role === "admin" ? "gp-role-admin" : "gp-role-member"}`}>
                              {member.role}
                            </span>
                            {selectedGroup.myRole === "admin" && (
                              <div className="gp-member-actions">
                                <button className="gp-btn gp-btn-secondary gp-btn-sm" style={{ marginTop: 0 }}
                                  onClick={() => changeRole(member._id, member.role === "admin" ? "member" : "admin")}>
                                  {member.role === "admin" ? "Demote" : "Promote"}
                                </button>
                                <button className="gp-btn gp-btn-danger gp-btn-sm" style={{ marginTop: 0 }}
                                  onClick={() => removeMember(member._id)}>
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* Settings Tab */}
                  {activeTab === "settings" && (
                    <form onSubmit={updateSettings}>
                      <div className="gp-field">
                        <label className="gp-label">Group Name</label>
                        <input className="gp-input" value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)} required />
                      </div>
                      <div className="gp-field">
                        <label className="gp-label">Base Currency</label>
                        <div className="gp-currency-row">
                          {["USD", "INR", "EUR", "GBP"].map((c) => (
                            <button key={c} type="button"
                              className={`gp-currency-opt${settingsCurrency === c ? " active" : ""}`}
                              onClick={() => setSettingsCurrency(c)}>
                              {currencyFlags[c]} {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedGroup.inviteLink && (
                        <div className="gp-field">
                          <label className="gp-label">Invite Link</label>
                          <input className="gp-input" value={selectedGroup.inviteLink} readOnly />
                        </div>
                      )}
                      <div className="gp-divider" />
                      <button className="gp-btn gp-btn-primary" disabled={saving} type="submit">
                        {saving ? "Saving…" : "💾 Save Settings"}
                      </button>
                      <button className="gp-btn gp-btn-danger" disabled={saving} type="button"
                        onClick={deleteCurrentGroup}>
                        🗑️ Delete Group
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupPage;