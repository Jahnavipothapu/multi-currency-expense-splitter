import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const quickLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Groups", href: "/groups" },
    { name: "Add Expense", href: "/expense" },
    { name: "Balances", href: "/balances" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "#" },
    { name: "Contact Us", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ];

  const s = {
    footer: {
      backgroundColor: "#030712",
      color: "white",
      marginTop: "80px",
      fontFamily: "Inter, system-ui, sans-serif",
    } as React.CSSProperties,

    topLine: {
      height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.7), transparent)",
    } as React.CSSProperties,

    inner: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "64px 32px 40px",
    } as React.CSSProperties,

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "48px",
      marginBottom: "56px",
    } as React.CSSProperties,

    sectionLabel: {
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      color: "#6b7280",
      marginBottom: "20px",
    } as React.CSSProperties,

    linkItem: {
      fontSize: "14px",
      color: "#9ca3af",
      textDecoration: "none",
      display: "block",
      marginBottom: "12px",
      transition: "color 0.15s",
    } as React.CSSProperties,

    divider: {
      height: "1px",
      background: "linear-gradient(90deg, transparent, #1f2937, transparent)",
      marginBottom: "28px",
    } as React.CSSProperties,

    bottomBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap" as const,
      gap: "16px",
    } as React.CSSProperties,

    bottomText: {
      fontSize: "12px",
      color: "#4b5563",
    } as React.CSSProperties,
  };

  return (
    <footer style={s.footer}>
      {/* Top accent line */}
      <div style={s.topLine} />

      <div style={s.inner}>
        {/* ── 4-column grid ── */}
        <div style={s.grid}>

          {/* Col 1 — Brand */}
          <div>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: "#10b981", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h12M9 3v12M5 5l8 8M13 5l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                Expense<span style={{ color: "#34d399" }}>Splitter</span>
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.7, marginBottom: "24px" }}>
              The easiest way to split bills, track shared expenses, and settle up with friends — without the awkward math.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
              {[
                { value: "50K+", label: "Users" },
                { value: "$2M+", label: "Settled" },
                { value: "4.9★", label: "Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                {
                  label: "X",
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
                },
                {
                  label: "Instagram",
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>,
                },
                {
                  label: "LinkedIn",
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    backgroundColor: "#1f2937", border: "1px solid #374151",
                    color: "#9ca3af", display: "flex", alignItems: "center",
                    justifyContent: "center", textDecoration: "none", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.backgroundColor = "#10b981";
                    el.style.borderColor = "#10b981";
                    el.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.backgroundColor = "#1f2937";
                    el.style.borderColor = "#374151";
                    el.style.color = "#9ca3af";
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Product */}
          <div>
            <div style={s.sectionLabel}>Product</div>
            {quickLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                style={s.linkItem}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#34d399")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af")}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Col 3 — Support */}
          <div>
            <div style={s.sectionLabel}>Support</div>
            {supportLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                style={s.linkItem}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#34d399")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af")}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Col 4 — Newsletter */}
          <div>
            <div style={s.sectionLabel}>Stay in the loop</div>
            <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.7, marginBottom: "20px" }}>
              Get product updates, money-saving tips, and feature announcements straight to your inbox.
            </p>

            {subscribed ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                backgroundColor: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: "12px", padding: "12px 16px",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  backgroundColor: "#10b981", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: "13px", color: "#34d399", fontWeight: 500 }}>You're subscribed!</span>
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex", borderRadius: "10px", overflow: "hidden",
                  border: "1px solid #374151", backgroundColor: "#111827",
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    placeholder="you@example.com"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      outline: "none", padding: "10px 14px",
                      fontSize: "13px", color: "#e5e7eb",
                    }}
                  />
                  <button
                    onClick={handleSubscribe}
                    style={{
                      backgroundColor: "#10b981", color: "white",
                      border: "none", padding: "10px 16px",
                      fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#059669")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#10b981")}
                  >
                    Subscribe
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: "#4b5563", marginTop: "8px" }}>
                  No spam, ever. Unsubscribe anytime.
                </p>
              </>
            )}

            {/* App store buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              {["App Store", "Google Play"].map((store) => (
                <a
                  key={store}
                  href="#"
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 12px", borderRadius: "8px",
                    backgroundColor: "#1f2937", border: "1px solid #374151",
                    color: "#9ca3af", textDecoration: "none",
                    fontSize: "12px", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "#6b7280";
                    el.style.color = "#e5e7eb";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "#374151";
                    el.style.color = "#9ca3af";
                  }}
                >
                  {store === "App Store" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.22.14-2.19 1.28-2.17 3.83.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.75M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.18 23.76c.3.17.65.19.97.07l11.65-11.65L12.06 8.4 3.18 23.76zm15.69-12.62L16.1 9.4 4.44 2.17c-.32-.19-.7-.2-1.02-.04l11.64 11.65 3.81-2.64zM21.2 10.9l-2.76-1.6-3.06 3.07 3.06 3.07 2.78-1.63c.79-.46.79-1.46-.02-1.91zM4.14 1.83c-.02.09-.02.18-.02.27v19.8c0 .1.01.2.03.29l11.3-11.3L4.14 1.83z" />
                    </svg>
                  )}
                  {store}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Bottom bar */}
        <div style={s.bottomBar}>
          <span style={s.bottomText}>© 2026 ExpenseSplitter, Inc. All rights reserved.</span>
          <span style={s.bottomText}>
            Made with <span style={{ color: "#ef4444" }}>♥</span> for people who hate awkward money convos
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy", "Terms", "Cookies"].map((link) => (
              <a
                key={link}
                href="#"
                style={{ ...s.bottomText, textDecoration: "none" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#4b5563")}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;