"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <span
        className="btn btn-outline theme-toggle-skeleton"
        aria-hidden="true"
        style={{ width: 44, height: 44, padding: 0 }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="btn btn-outline"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="sr-only">Changer de thème</span>
    </button>
  );
}
