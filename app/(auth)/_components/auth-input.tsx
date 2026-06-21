"use client";

import React, { useState } from "react";

const AUTH_INPUT_CSS = `
  .auth-input-wrap {
    background: #f8fafc;
    color: #0f172a;
  }
  .auth-input-wrap.is-focus {
    background: #ffffff;
  }
  .auth-input-wrap.is-disabled {
    background: rgba(248,250,252,.5);
  }
  .auth-input-wrap input {
    color: #0f172a;
  }
  .auth-input-wrap input:-webkit-autofill,
  .auth-input-wrap input:-webkit-autofill:hover,
  .auth-input-wrap input:-webkit-autofill:focus,
  .auth-input-wrap input:-webkit-autofill:active {
    -webkit-text-fill-color: #0f172a;
    caret-color: #0f172a;
    background-color: transparent !important;
    box-shadow: 0 0 0 1000px #f8fafc inset !important;
    transition: background-color 999999s ease-out;
  }
  .auth-input-wrap.is-focus input:-webkit-autofill,
  .auth-input-wrap.is-focus input:-webkit-autofill:hover,
  .auth-input-wrap.is-focus input:-webkit-autofill:focus,
  .auth-input-wrap.is-focus input:-webkit-autofill:active {
    -webkit-text-fill-color: #0f172a;
    caret-color: #0f172a;
    box-shadow: 0 0 0 1000px #ffffff inset !important;
  }
  .auth-input-wrap input::placeholder {
    color: #94a3b8;
  }
`;

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
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_INPUT_CSS }} />
    <div
      className={[
        "auth-input-wrap",
        focus ? "is-focus" : "",
        disabled ? "is-disabled" : "",
      ].filter(Boolean).join(" ")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 36, /* h-9 */
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
          height: "100%",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {trailing}
    </div>
    </>
  );
}
