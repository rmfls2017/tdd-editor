import { useState } from "react";
import { C, T, S } from "../constants/theme.js";

// ═══════════════════════════════════════
//  Micro Components (shared across app)
// ═══════════════════════════════════════

// Badge component
export const B = ({ c, children, s: sm }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    padding: sm ? "2px 6px" : "4px 8px",
    borderRadius: 3,
    fontSize: sm ? T.xs : T.sm,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono',monospace",
    background: c + "14",
    color: c,
    border: `1px solid ${c}25`,
    letterSpacing: .2,
    whiteSpace: "nowrap"
  }}>
    {children}
  </span>
);

// Chip/Tag component with toggle state
export const Chip = ({ on, onClick, children, count, c: cc }) => (
  <button onClick={onClick} style={{
    display: "inline-flex",
    gap: S[1],
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 3,
    fontSize: T.sm,
    fontWeight: on ? 600 : 400,
    fontFamily: "inherit",
    background: on ? (cc || C.ac) + "12" : C.s2,
    color: on ? (cc || C.ac) : C.txD,
    border: `1px solid ${on ? (cc || C.ac) + "38" : C.bd}`,
    cursor: "pointer",
    transition: "all .1s"
  }}>
    {children}
    {count != null && (
      <span style={{
        fontSize: 9,
        padding: "0 4px",
        borderRadius: 2,
        background: on ? (cc || C.ac) + "18" : C.s3
      }}>
        {count}
      </span>
    )}
  </button>
);

// Section header with icon and optional right content
export const Sec = ({ icon, children, right }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    borderBottom: `1px solid ${C.bd}`,
    marginBottom: S[2]
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: T.sm,
      fontWeight: 600,
      color: C.txB
    }}>
      <span style={{ fontSize: T.sm + 1 }}>{icon}</span>
      {children}
    </div>
    {right}
  </div>
);

// Button component with 3-tier hierarchy
export const Btn = ({ children, onClick, variant = "secondary", size = "md", disabled, icon }) => {
  const sizes = {
    sm: { padding: "4px 10px", fontSize: T.xs },
    md: { padding: "8px 16px", fontSize: T.sm },
    lg: { padding: "10px 20px", fontSize: T.base },
  };
  const variants = {
    primary: { background: C.ac, color: "#fff", border: "none" },
    secondary: { background: "transparent", border: `1px solid ${C.ac}`, color: C.ac },
    ghost: { background: "transparent", border: `1px solid ${C.bd}`, color: C.tx },
  };
  const s = sizes[size];
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex",
      alignItems: "center",
      gap: S[1],
      padding: s.padding,
      fontSize: s.fontSize,
      fontWeight: 600,
      fontFamily: "inherit",
      borderRadius: 4,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      ...v,
      transition: "all .1s"
    }}>
      {icon && <span style={{ fontSize: s.fontSize + 1 }}>{icon}</span>}
      {children}
    </button>
  );
};

// EmptyState component for empty data states
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign: "center", padding: 40 }}>
    <div style={{ fontSize: 32, opacity: 0.3, marginBottom: S[3] }}>{icon}</div>
    <div style={{ fontSize: T.h2, color: C.txB, marginBottom: S[1] }}>{title}</div>
    <div style={{ fontSize: T.sm, color: C.txD, marginBottom: S[4] }}>{description}</div>
    {action}
  </div>
);

// TextArea component for multi-line text input
export const TextArea = ({ value, onChange, mono, rows = 4, placeholder }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: "100%",
      padding: "8px 10px",
      background: C.s3,
      border: `1px solid ${C.bd}`,
      borderRadius: 3,
      color: C.txB,
      fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit",
      fontSize: T.sm,
      resize: "vertical",
      minHeight: rows * 20,
      outline: "none",
      boxSizing: "border-box"
    }}
  />
);

// Select component for dropdown selection
export const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      padding: "6px 10px",
      background: C.s3,
      border: `1px solid ${C.bd}`,
      borderRadius: 3,
      color: C.txB,
      fontSize: T.sm,
      outline: "none",
      cursor: "pointer"
    }}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// ActionMenu component - dropdown menu for contextual actions
export const ActionMenu = ({ trigger, items }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 24,
          background: open ? C.s3 : "transparent",
          border: `1px solid ${open ? C.bd : "transparent"}`,
          borderRadius: 3,
          color: C.txD,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          transition: "all .1s"
        }}
      >
        {trigger || "⋯"}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
          />

          {/* Menu */}
          <div style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: C.s2,
            border: `1px solid ${C.bd}`,
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 50,
            minWidth: 140,
            overflow: "hidden"
          }}>
            {items.map((item, i) =>
              item.divider ? (
                <div key={i} style={{ height: 1, background: C.bd, margin: "4px 0" }} />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: T.sm,
                    color: item.danger ? C.rd : C.tx,
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "background .1s"
                  }}
                  onMouseEnter={e => e.target.style.background = C.s3}
                  onMouseLeave={e => e.target.style.background = "transparent"}
                >
                  <span style={{ width: 16, textAlign: "center" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};
