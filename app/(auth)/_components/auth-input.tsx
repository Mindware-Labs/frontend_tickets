"use client";

import React, { useState } from "react";

export function AuthInput({
  id, type = "text", value, onChange, placeholder, autoComplete,
  leadingIcon, trailing, autoFocus, disabled, invalid, onKeyDown,
}: {
  id?: string; type?: string; value: string; disabled?: boolean; invalid?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string; autoComplete?: string;
  leadingIcon?: React.ReactNode; trailing?: React.ReactNode; autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);

  const borderColor = invalid && !focus
    ? "rgba(200,74,31,.45)"
    : focus
      ? "rgba(31,142,120,.65)"
      : "rgba(15,30,28,.10)";

  const boxShadow = focus
    ? invalid
      ? "0 0 0 3px rgba(200,74,31,.12),0 1px 3px rgba(0,0,0,.04)"
      : "0 0 0 3px rgba(31,142,120,.12),0 1px 3px rgba(0,0,0,.04)"
    : "0 1px 2px rgba(0,0,0,.03)";

  const iconColor = invalid && !focus
    ? "rgba(200,74,31,.6)"
    : focus
      ? "rgba(31,142,120,.7)"
      : "rgba(15,30,28,.35)";

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: disabled ? "rgba(15,30,28,.03)" : focus ? "#fff" : "#FAFCFB",
        border: `1.5px solid ${borderColor}`,
        boxShadow,
        borderRadius: 12, padding: "0 14px", height: 44,
        transition: "border-color .18s,box-shadow .18s,background .18s",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {leadingIcon && (
        <span style={{ color: iconColor, display: "inline-flex", flexShrink: 0, transition: "color .18s" }}>
          {leadingIcon}
        </span>
      )}
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        autoFocus={autoFocus} disabled={disabled} onKeyDown={onKeyDown}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: 0, outline: "none", background: "transparent",
          fontFamily: "inherit", fontSize: 14, color: "#0E1B19", height: "100%",
          letterSpacing: "-.01em", cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {trailing}
    </div>
  );
}
