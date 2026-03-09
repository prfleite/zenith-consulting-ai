import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

type ThemePreference = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeContextType = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("light", resolved === "light");
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem("apex-theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    localStorage.setItem("apex-theme", t);
  }, []);

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      applyTheme(theme);
      return;
    }

    const resolved = getSystemTheme();
    setResolvedTheme(resolved);
    applyTheme(resolved);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const r = e.matches ? "dark" : "light";
      setResolvedTheme(r);
      applyTheme(r);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
