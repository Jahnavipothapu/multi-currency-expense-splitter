import { type FormEvent, useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";

/* ─── Inline styles as a <style> tag injected once ─────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #0d0d12;
    --surface:  #f5f3ef;
    --card:     #ffffff;
    --accent:   #2d6a4f;
    --accent2:  #52b788;
    --muted:    #8a8a99;
    --border:   #e2ded8;
    --error:    #c0392b;
    --radius:   14px;
    --shadow:   0 24px 64px rgba(0,0,0,.10), 0 4px 16px rgba(0,0,0,.06);
  }

  .ap-root {
    min-height: 100vh;
    background: var(--surface);
    display: flex;
    align-items: stretch;
    font-family: 'DM Sans', sans-serif;
    color: var(--ink);
    position: relative;
    overflow: hidden;
  }

  /* ── Left decorative panel ── */
  .ap-panel {
    flex: 0 0 46%;
    background: var(--ink);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 52px 48px;
    animation: panelIn .9s cubic-bezier(.16,1,.3,1) both;
  }

  @keyframes panelIn {
    from { transform: translateX(-40px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }

  .ap-panel-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
  }
  .ap-panel-blob-1 {
    width: 340px; height: 340px;
    background: rgba(82,183,136,.22);
    top: -60px; left: -80px;
    animation: drift1 12s ease-in-out infinite alternate;
  }
  .ap-panel-blob-2 {
    width: 260px; height: 260px;
    background: rgba(45,106,79,.30);
    bottom: 100px; right: -60px;
    animation: drift2 14s ease-in-out infinite alternate;
  }
  .ap-panel-blob-3 {
    width: 180px; height: 180px;
    background: rgba(82,183,136,.14);
    top: 800%; left: 800%;
    animation: drift1 10s ease-in-out infinite alternate-reverse;
  }

  @keyframes drift1 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(24px,18px) scale(1.08); }
  }
  @keyframes drift2 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(-20px,14px) scale(1.1); }
  }

  .ap-panel-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .ap-panel-content {
    position: relative;
    z-index: 1;
  }

  .ap-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: auto;
    position: absolute;
    top: 48px; left: 48px;
  }

  .ap-logo-mark {
    width: 36px; height: 36px;
    background: var(--accent2);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 15px;
    color: var(--ink);
    letter-spacing: -.5px;
  }

  .ap-logo-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 17px;
    color: #ffffff;
    letter-spacing: -.3px;
  }

  .ap-panel-quote {
    font-family: 'Syne', sans-serif;
    font-size: clamp(26px,3.2vw,40px);
    font-weight: 700;
    line-height: 1.18;
    color: #ffffff;
    letter-spacing: -.8px;
    margin-bottom: 18px;
  }

  .ap-panel-quote em {
    font-style: normal;
    color: var(--accent2);
  }

  .ap-panel-sub {
    font-size: 15px;
    color: rgba(255,255,255,.48);
    line-height: 1.6;
    max-width: 320px;
  }

  .ap-panel-chips {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 32px;
  }

  .ap-chip {
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.10);
    border-radius: 100px;
    padding: 6px 14px;
    font-size: 12.5px;
    color: rgba(255,255,255,.55);
    letter-spacing: .2px;
  }

  /* ── Right form area ── */
  .ap-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    animation: rightIn .9s .1s cubic-bezier(.16,1,.3,1) both;
  }

  @keyframes rightIn {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ap-card {
    width: 100%;
    max-width: 420px;
  }

  .ap-card-header {
    margin-bottom: 36px;
  }

  .ap-eyebrow {
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }

  .ap-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(26px, 3vw, 34px);
    font-weight: 800;
    letter-spacing: -.9px;
    color: var(--ink);
    line-height: 1.1;
  }

  .ap-subtitle {
    margin-top: 10px;
    font-size: 14.5px;
    color: var(--muted);
    line-height: 1.6;
  }

  /* ── Tab toggle ── */
  .ap-tabs {
    display: flex;
    background: #f0ece6;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 30px;
    gap: 4px;
  }

  .ap-tab {
    flex: 1;
    padding: 9px 16px;
    border: none;
    border-radius: 9px;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    transition: all .22s ease;
    letter-spacing: -.1px;
  }

  .ap-tab.active {
    background: #ffffff;
    color: var(--ink);
    box-shadow: 0 2px 8px rgba(0,0,0,.09);
    font-weight: 600;
  }

  /* ── Form ── */
  .ap-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ap-field {
    position: relative;
  }

  .ap-field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: .5px;
    text-transform: uppercase;
    margin-bottom: 7px;
  }

  .ap-field-inner {
    position: relative;
    display: flex;
    align-items: center;
  }

  .ap-field-icon {
    position: absolute;
    left: 14px;
    color: var(--muted);
    font-size: 13px;
    pointer-events: none;
    transition: color .2s;
    z-index: 1;
  }

  .ap-input {
    width: 100%;
    padding: 13px 14px 13px 40px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: #faf9f7;
    font-family: 'DM Sans', sans-serif;
    font-size: 14.5px;
    color: var(--ink);
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
    -webkit-appearance: none;
  }

  .ap-input::placeholder { color: #bab7b0; }

  .ap-input:focus {
    border-color: var(--accent2);
    background: #ffffff;
    box-shadow: 0 0 0 3.5px rgba(82,183,136,.13);
  }

  .ap-input:focus + .ap-field-focus-line { width: 100%; }
  .ap-field-inner:has(.ap-input:focus) .ap-field-icon { color: var(--accent); }

  /* ── Field slide-in animation ── */
  .ap-field-animated {
    overflow: hidden;
    animation: fieldIn .32s cubic-bezier(.16,1,.3,1) both;
  }

  @keyframes fieldIn {
    from { opacity: 0; transform: translateY(-10px); max-height: 0; }
    to   { opacity: 1; transform: translateY(0);     max-height: 100px; }
  }

  /* ── Submit button ── */
  .ap-btn {
    margin-top: 6px;
    width: 100%;
    padding: 14px 20px;
    border: none;
    border-radius: 11px;
    background: var(--ink);
    color: #ffffff;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -.2px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform .18s ease, box-shadow .18s ease, background .18s;
  }

  .ap-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    opacity: 0;
    transition: opacity .3s ease;
  }

  .ap-btn:hover:not(:disabled)::before { opacity: 1; }

  .ap-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(45,106,79,.32);
  }

  .ap-btn:active:not(:disabled) { transform: translateY(0); }

  .ap-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .ap-btn-label {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .ap-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Footer toggle ── */
  .ap-footer {
    margin-top: 26px;
    text-align: center;
    font-size: 13.5px;
    color: var(--muted);
  }

  .ap-footer-link {
    background: none;
    border: none;
    color: var(--accent);
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 4px;
    padding: 0;
    text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color .2s;
  }

  .ap-footer-link:hover { text-decoration-color: var(--accent); }

  .ap-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
    color: var(--border);
    font-size: 12px;
    color: var(--muted);
  }

  .ap-divider::before,
  .ap-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── Responsive ── */
  @media (max-width: 760px) {
    .ap-panel { display: none; }
    .ap-right { padding: 32px 20px; }
  }
`;

/* ─── Component ─────────────────────────────────────────────────────────── */
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, token } = useAuth();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* Inject CSS once */
  useEffect(() => {
    if (!document.getElementById("ap-styles")) {
      const tag = document.createElement("style");
      tag.id = "ap-styles";
      tag.textContent = CSS;
      document.head.appendChild(tag);
      styleRef.current = tag;
    }
    return () => {
      styleRef.current?.remove();
    };
  }, []);

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(name.trim(), email.trim().toLowerCase(), password);
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((v) => !v);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="ap-root">
      {/* ── Left decorative panel ── */}
      <aside className="ap-panel">
        <div className="ap-panel-grid" />
        <div className="ap-panel-blob ap-panel-blob-1" />
        <div className="ap-panel-blob ap-panel-blob-2" />
        <div className="ap-panel-blob ap-panel-blob-3" />

        <div className="ap-logo">
          <div className="ap-logo-mark">SP</div>
          <span className="ap-logo-name">SplitWise</span>
        </div>

        <div className="ap-panel-content">
          <p className="ap-panel-quote">
            Split bills,<br />
            not <em>friendships.</em>
          </p>
          <p className="ap-panel-sub">
            Track shared expenses, settle up instantly, and keep every group in balance — effortlessly.
          </p>
          <div className="ap-panel-chips">
            {["Group trips", "Roommates", "Dinners out", "Events"].map((c) => (
              <span key={c} className="ap-chip">{c}</span>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right form area ── */}
      <main className="ap-right">
        <div className="ap-card">
          {/* Header */}
          <div className="ap-card-header">
            <p className="ap-eyebrow">{isLogin ? "Welcome back" : "Get started"}</p>
            <h1 className="ap-title">
              {isLogin ? "Sign in to\nyour account" : "Create your\naccount"}
            </h1>
            <p className="ap-subtitle">
              {isLogin
                ? "Manage your group expenses in one place."
                : "Start tracking shared expenses with a clean, simple workflow."}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="ap-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={isLogin}
              className={`ap-tab${isLogin ? " active" : ""}`}
              onClick={() => { if (!isLogin) switchMode(); }}
              type="button"
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={!isLogin}
              className={`ap-tab${!isLogin ? " active" : ""}`}
              onClick={() => { if (isLogin) switchMode(); }}
              type="button"
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="ap-form" noValidate>
            {!isLogin && (
              <div className="ap-field ap-field-animated">
                <label className="ap-field-label">Full name</label>
                <div className="ap-field-inner">
                  <FaUser className="ap-field-icon" />
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ap-input"
                    minLength={2}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="ap-field">
              <label className="ap-field-label">Email address</label>
              <div className="ap-field-inner">
                <FaEnvelope className="ap-field-icon" />
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ap-input"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-field-label">Password</label>
              <div className="ap-field-inner">
                <FaLock className="ap-field-icon" />
                <input
                  type="password"
                  placeholder={isLogin ? "Your password" : "Min. 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ap-input"
                  minLength={6}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
            </div>

            <button type="submit" className="ap-btn" disabled={loading}>
              <span className="ap-btn-label">
                {loading && <span className="ap-spinner" />}
                {loading
                  ? isLogin ? "Signing in…" : "Creating account…"
                  : isLogin ? "Sign in" : "Create account"}
              </span>
            </button>
          </form>

          {/* Footer */}
          <p className="ap-footer">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button type="button" className="ap-footer-link" onClick={switchMode}>
              {isLogin ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;