"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  "use no memo";
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
