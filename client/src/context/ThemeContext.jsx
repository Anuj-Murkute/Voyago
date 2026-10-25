
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "voyago-theme";

function getInitialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === "light" || saved === "dark") {
      return saved;
    }

    // Migrate the old "system" preference to the current system theme.
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = mode;
    root.dataset.themeMode = mode;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // The selected theme still works for this session.
    }
  }, [mode]);

  function setThemeMode(nextMode) {
    if (nextMode !== "light" && nextMode !== "dark") {
      return;
    }

    setMode(nextMode);
  }

  function toggleTheme() {
    setMode((currentMode) =>
      currentMode === "dark" ? "light" : "dark"
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: mode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
