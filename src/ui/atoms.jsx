import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Svg = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

export const Icon = {
  search: (p) => <Svg {...p} d={["M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0", "M21 21l-4.3-4.3"]} />,
  ext: (p) => <Svg {...p} d={["M14 4h6v6", "M20 4 10 14", "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"]} />,
  x: (p) => <Svg {...p} d={["M6 6l12 12", "M18 6 6 18"]} />,
  check: (p) => <Svg {...p} d={["M5 12l4 4L19 7"]} />,
  plus: (p) => <Svg {...p} d={["M12 5v14", "M5 12h14"]} />,
  arrow: (p) => <Svg {...p} d={["M5 12h14", "M13 6l6 6-6 6"]} />,
  back: (p) => <Svg {...p} d={["M19 12H5", "M11 6l-6 6 6 6"]} />,
  more: (p) => <Svg {...p} d={["M5 12h.01", "M12 12h.01", "M19 12h.01"]} />,
  pin: (p) => <Svg {...p} d={["M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z", "M12 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"]} />,
  trash: (p) => <Svg {...p} d={["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13"]} />,
};

export function Field({ label, optional, hint, error, children, className = "" }) {
  return (
    <label className={`field ${error ? "err" : ""} ${className}`}>
      <span>
        {label}
        {optional && <em>{optional === true ? "optional" : optional}</em>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function TextField({ label, value, onChange, optional, hint, error, ...rest }) {
  return (
    <Field label={label} optional={optional} hint={hint} error={error}>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
    </Field>
  );
}

/** Number input with an optional $ prefix or unit suffix. Keeps the raw string so blanks stay blank. */
export function NumberField({ label, value, onChange, prefix, suffix, optional, hint, error, ...rest }) {
  const input = <input type="number" inputMode="decimal" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />;
  return (
    <Field label={label} optional={optional} hint={hint} error={error}>
      {prefix || suffix ? (
        <div className={`affix ${suffix ? "suffix" : ""}`}>
          <i>{prefix || suffix}</i>
          {input}
        </div>
      ) : (
        input
      )}
    </Field>
  );
}

export function DateField({ label, value, onChange, optional, hint, error, ...rest }) {
  return (
    <Field label={label} optional={optional} hint={hint} error={error}>
      <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} onInput={(e) => onChange(e.currentTarget.value)} {...rest} />
    </Field>
  );
}

export function Chip({ tone, children, ...rest }) {
  const Tag = rest.onClick ? "button" : "span";
  return (
    <Tag className={`chip ${tone || ""}`} {...rest}>
      {tone && <i />}
      {children}
    </Tag>
  );
}

export function Tile({ label, value, sub }) {
  return (
    <div className="tile">
      <div className="t-label">{label}</div>
      <div className="t-val">{value}</div>
      {sub && <div className="t-sub">{sub}</div>}
    </div>
  );
}

export function Drawer({ title, eyebrow, onClose, children }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    const key = (e) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", key);
    ref.current?.focus();
    return () => {
      window.removeEventListener("keydown", key);
      before?.focus?.(); // hand focus back to the control that opened the drawer
    };
  }, []);
  // Portaled to the body so it sits above sticky page regions.
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header>
          <div>
            {eyebrow && <div className="sect" style={{ marginBottom: 6 }}>{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <button className="btn ghost small" onClick={onClose} aria-label="Close">
            <Icon.x />
          </button>
        </header>
        <div className="dbody">{children}</div>
      </aside>
    </>,
    document.body,
  );
}

export function Menu({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const key = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div className="menu" ref={ref}>
      <button className="btn ghost" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((v) => !v)}>
        <Icon.more size={18} />
      </button>
      {open && (
        <div className="pop" role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
