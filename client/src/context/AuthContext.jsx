
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCurrentUser } from "../services/api";

const AuthContext = createContext(null);

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readStoredUser() {
  try {
    const value = readStorage("user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    // In-memory state is still cleared.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStorage("token"));
  const [user, setUser] = useState(readStoredUser);
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(readStorage("token"))
  );

  useEffect(() => {
    let active = true;

    const handleExpiredSession = () => {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setAuthLoading(false);
    };

    window.addEventListener(
      "voyago:session-expired",
      handleExpiredSession
    );

    async function validateSession() {
      const savedToken = readStorage("token");

      if (!savedToken) {
        if (active) {
          setToken(null);
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const response = await getCurrentUser(savedToken);

        if (!active) return;

        const currentUser = response.user || response;

        if (!currentUser || !(currentUser._id || currentUser.id)) {
          throw new Error("Invalid user response.");
        }

        setToken(savedToken);
        setUser(currentUser);

        try {
          localStorage.setItem("user", JSON.stringify(currentUser));
        } catch {
          // Keep the session usable in memory.
        }
      } catch {
        if (!active) return;

        clearStoredSession();
        setToken(null);
        setUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    validateSession();

    return () => {
      active = false;
      window.removeEventListener(
        "voyago:session-expired",
        handleExpiredSession
      );
    };
  }, []);

  const login = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error(
        "The server returned an incomplete authentication response."
      );
    }

    try {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch {
      // Keep the session in memory if storage is unavailable.
    }

    setToken(data.token);
    setUser(data.user);
    setAuthLoading(false);
  };

  const updateUser = (updates) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const nextUser = { ...currentUser, ...updates };

      try {
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch {
        // In-memory profile remains updated.
      }

      return nextUser;
    });
  };

  const logout = () => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setAuthLoading(false);
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    authLoading,
    isAuthenticated: Boolean(token && user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}