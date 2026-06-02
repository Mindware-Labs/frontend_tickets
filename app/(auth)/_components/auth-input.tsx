"use client";

import React, { useState } from "react";

export function AuthInput({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  leadingIcon,
  trailing,
  autoFocus,
  disabled,
  invalid,
  onKeyDown,
  onBlur: onBlurProp,
}: {
  id?: string;
  type?: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoComplete?: string;
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);

  const borderColor = invalid && !focus
    ? "#f87171"
    : focus
      ? "#008f68"
      : "transparent";

  const boxShadow = focus
    ? invalid
      ? "0 0 0 2px rgba(248,113,113,.20)"
      : "0 0 0 2px rgba(0,143,104,.20)"
    : "none";

  const iconColor = invalid && !focus
    ? "#f87171"
    : focus
      ? "#008f68"
      : "#94a3b8";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 36, /* h-9 */
        background: disabled ? "rgba(248,250,252,.5)" : focus ? "#ffffff" : "#f8fafc",
        border: `1.5px solid ${borderColor}`,
        boxShadow,
        borderRadius: 8, /* rounded-lg */
        padding: "0 10px",
        transition: "border-color .15s,box-shadow .15s,background .15s",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {leadingIcon && (
        <span
          style={{
            color: iconColor,
            display: "inline-flex",
            flexShrink: 0,
            transition: "color .15s",
          }}
        >
          {leadingIcon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onFocus={() => setFocus(true)}
        onBlur={() => { setFocus(false); onBlurProp?.(); }}
        style={{
          flex: 1,
          border: 0,
          outline: "none",
          background: "transparent",
          fontFamily: "inherit",
          fontSize: 13,
          color: "#0f172a",
          height: "100%",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {trailing}
    </div>
  );
}
