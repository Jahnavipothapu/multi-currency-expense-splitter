import { type FormEvent, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const avatarColor = (name: string) => {
  const colors = ["#3d8c5f", "#2563eb", "#7c3aed", "#db2777", "#d97706", "#0891b2"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const ProfilePage = () => {
  const { user, setLocalUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [summary, setSummary] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    api.get("/auth/me/summary").then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await api.put("/auth/me", { name, email, avatarUrl });
      setLocalUser({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        avatarUrl: response.data.avatarUrl,
      });
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayName = name || user?.name || "User";
  const netBalance = summary ? (summary.totalOwed - summary.totalOwes) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .pp-root {
          font-family: 'DM Sans', sans-serif;
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 20px 64px;
          color: #1a1f2e;
        }

        /* Header */
        .pp-eyebrow {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #3d8c5f; margin: 0 0 6px;
        }
        .pp-title { font-size: 28px; font-weight: 700; margin: 0 0 28px; color: #1a1f2e; }

        /* Hero card */
        .pp-hero {
          background: linear-gradient(135deg, #1e4d35 0%, #2d7a52 60%, #3d8c5f 100%);
          border-radius: 20px;
          padding: 28px 28px 24px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          box-shadow: 0 4px 20px rgba(45,122,82,0.25);
          position: relative;
          overflow: hidden;
        }
        .pp-hero::before {
          content: '';
          position: absolute;
          right: -40px; top: -40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .pp-hero::after {
          content: '';
          position: absolute;
          right: 60px; bottom: -60px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .pp-hero-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; font-weight: 700; color: #fff;
          border: 3px solid rgba(255,255,255,0.3);
          flex-shrink: 0; overflow: hidden;
          background: rgba(255,255,255,0.15);
          position: relative; z-index: 1;
        }
        .pp-hero-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .pp-hero-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .pp-hero-name {
          font-size: 22px; font-weight: 700; color: #fff;
          margin: 0 0 4px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .pp-hero-email { font-size: 13.5px; color: rgba(255,255,255,0.7); margin: 0; }
        .pp-hero-net {
          display: flex; flex-direction: column; align-items: flex-end;
          position: relative; z-index: 1;
        }
        .pp-hero-net-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: rgba(255,255,255,0.6); margin-bottom: 4px;
        }
        .pp-hero-net-value {
          font-family: 'DM Mono', monospace;
          font-size: 24px; font-weight: 600;
          color: #fff;
        }
        .pp-hero-net-value.positive { color: #86efac; }
        .pp-hero-net-value.negative { color: #fca5a5; }

        /* Grid */
        .pp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 640px) { .pp-grid { grid-template-columns: 1fr; } }

        /* Panel */
        .pp-panel {
          background: #fff;
          border: 1.5px solid #e8ede6;
          border-radius: 20px;
          padding: 22px 22px 20px;
          box-shadow: 0 2px 12px rgba(30,50,30,0.04);
        }
        .pp-panel-title {
          font-size: 14px; font-weight: 700; color: #1a1f2e;
          display: flex; align-items: center; gap: 8px;
          margin: 0 0 20px;
        }
        .pp-panel-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #3d8c5f; flex-shrink: 0;
        }

        /* Form */
        .pp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .pp-label {
          font-size: 11.5px; font-weight: 600; color: #6b7280;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .pp-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #1a1f2e;
          background: #f7f9f7;
          border: 1.5px solid #e2e8df;
          border-radius: 10px;
          padding: 10px 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%; box-sizing: border-box;
        }
        .pp-input:focus {
          border-color: #3d8c5f;
          box-shadow: 0 0 0 3px rgba(61,140,95,0.12);
          background: #fff;
        }
        .pp-input::placeholder { color: #b0b8b0; }

        /* Avatar preview */
        .pp-avatar-preview-row {
          display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
        }
        .pp-avatar-preview {
          width: 48px; height: 48px; border-radius: 50%;
          border: 2px solid #e2e8df;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; color: #fff;
          overflow: hidden; flex-shrink: 0;
        }
        .pp-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
        .pp-avatar-hint { font-size: 12px; color: #9ca3af; }

        /* Alerts */
        .pp-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500; margin-bottom: 14px;
        }
        .pp-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
        .pp-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

        /* Save button */
        .pp-btn {
          width: 100%; padding: 11px;
          background: #2d7a52; color: #fff;
          border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 10px rgba(45,122,82,0.25);
        }
        .pp-btn:hover:not(:disabled) { background: #236643; transform: translateY(-1px); }
        .pp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Summary stats */
        .pp-stat-list { display: flex; flex-direction: column; gap: 10px; }
        .pp-stat-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: #f9fbf9;
          border: 1.5px solid #e8ede6;
          border-radius: 12px;
          transition: border-color 0.15s;
        }
        .pp-stat-row:hover { border-color: #c5deca; }
        .pp-stat-left { display: flex; align-items: center; gap: 10px; }
        .pp-stat-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .pp-stat-name { font-size: 13.5px; font-weight: 600; color: #374151; }
        .pp-stat-value {
          font-family: 'DM Mono', monospace;
          font-size: 15px; font-weight: 600;
        }
        .pp-stat-value.owed { color: #16a34a; }
        .pp-stat-value.owes { color: #ea580c; }
        .pp-stat-value.paid { color: #2563eb; }

        /* Loading skeleton */
        .pp-loading {
          display: flex; flex-direction: column; gap: 10px;
        }
        .pp-skeleton {
          height: 58px; border-radius: 12px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ebe8 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: pp-shimmer 1.4s infinite;
        }
        @keyframes pp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="pp-root">
        <p className="pp-eyebrow">Account</p>
        <h1 className="pp-title">Profile Settings</h1>

        {/* Hero */}
        <div className="pp-hero">
          <div className="pp-hero-avatar" style={{ background: !avatarUrl || imgError ? avatarColor(displayName) : undefined }}>
            {avatarUrl && !imgError ? (
              <img src={avatarUrl} alt={displayName} onError={() => setImgError(true)} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="pp-hero-info">
            <p className="pp-hero-name">{displayName}</p>
            <p className="pp-hero-email">{email || user?.email}</p>
          </div>
          {netBalance !== null && (
            <div className="pp-hero-net">
              <span className="pp-hero-net-label">Net Balance</span>
              <span className={`pp-hero-net-value ${netBalance >= 0 ? "positive" : "negative"}`}>
                {netBalance >= 0 ? "+" : ""}{netBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="pp-grid">
          {/* Edit Profile */}
          <div className="pp-panel">
            <p className="pp-panel-title"><span className="pp-panel-dot" />Edit Profile</p>

            {/* Avatar preview */}
            {(avatarUrl && !imgError) && (
              <div className="pp-avatar-preview-row">
                <div className="pp-avatar-preview">
                  <img src={avatarUrl} alt="Preview" onError={() => setImgError(true)} />
                </div>
                <span className="pp-avatar-hint">Avatar preview</span>
              </div>
            )}

            <form onSubmit={onSave}>
              {message && <div className="pp-alert pp-alert-success">✅ {message}</div>}
              {error && <div className="pp-alert pp-alert-error">⚠️ {error}</div>}

              <div className="pp-field">
                <label className="pp-label">Full Name</label>
                <input className="pp-input" value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required />
              </div>

              <div className="pp-field">
                <label className="pp-label">Email Address</label>
                <input className="pp-input" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email" placeholder="you@email.com" required />
              </div>

              <div className="pp-field">
                <label className="pp-label">Avatar URL <span style={{ color: "#b0b8b0", fontWeight: 400 }}>(optional)</span></label>
                <input className="pp-input" value={avatarUrl}
                  onChange={(e) => { setAvatarUrl(e.target.value); setImgError(false); }}
                  placeholder="https://example.com/photo.jpg" />
              </div>

              <button className="pp-btn" disabled={saving} type="submit">
                {saving ? "⏳ Saving…" : "💾 Save Profile"}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="pp-panel">
            <p className="pp-panel-title"><span className="pp-panel-dot" />My Balances</p>

            {!summary ? (
              <div className="pp-loading">
                <div className="pp-skeleton" />
                <div className="pp-skeleton" />
                <div className="pp-skeleton" />
              </div>
            ) : (
              <div className="pp-stat-list">
                <div className="pp-stat-row">
                  <div className="pp-stat-left">
                    <div className="pp-stat-icon" style={{ background: "#f0fdf4" }}>💰</div>
                    <span className="pp-stat-name">Total You Are Owed</span>
                  </div>
                  <span className="pp-stat-value owed">+{Number(summary.totalOwed).toFixed(2)}</span>
                </div>
                <div className="pp-stat-row">
                  <div className="pp-stat-left">
                    <div className="pp-stat-icon" style={{ background: "#fff7ed" }}>📤</div>
                    <span className="pp-stat-name">Total You Owe</span>
                  </div>
                  <span className="pp-stat-value owes">-{Number(summary.totalOwes).toFixed(2)}</span>
                </div>
                <div className="pp-stat-row">
                  <div className="pp-stat-left">
                    <div className="pp-stat-icon" style={{ background: "#eff6ff" }}>🧾</div>
                    <span className="pp-stat-name">Total You Paid</span>
                  </div>
                  <span className="pp-stat-value paid">{Number(summary.totalPaid).toFixed(2)}</span>
                </div>

                {/* Net */}
                {netBalance !== null && (
                  <div className="pp-stat-row" style={{
                    background: netBalance >= 0 ? "#f0fdf4" : "#fff7f7",
                    border: `1.5px solid ${netBalance >= 0 ? "#bbf7d0" : "#fecaca"}`,
                  }}>
                    <div className="pp-stat-left">
                      <div className="pp-stat-icon" style={{ background: netBalance >= 0 ? "#dcfce7" : "#fee2e2" }}>
                        {netBalance >= 0 ? "📈" : "📉"}
                      </div>
                      <span className="pp-stat-name">Net Position</span>
                    </div>
                    <span className="pp-stat-value" style={{ color: netBalance >= 0 ? "#16a34a" : "#dc2626" }}>
                      {netBalance >= 0 ? "+" : ""}{netBalance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;