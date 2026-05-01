import { createContext, useCallback, useContext, useState, useEffect } from "react";

const RoleContext = createContext(null);

// Store role in sessionStorage so each tab is independent
const ROLE_KEY = "qa_user_role";

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize role from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ROLE_KEY);
      if (saved) {
        setRole(saved);
      }
    } catch {}
    setLoading(false);
  }, []);

  const setUserRole = useCallback((newRole) => {
    setRole(newRole);
    try {
      if (newRole) {
        sessionStorage.setItem(ROLE_KEY, newRole);
      } else {
        sessionStorage.removeItem(ROLE_KEY);
      }
    } catch {}
  }, []);

  const clearRole = useCallback(() => {
    setRole(null);
    try {
      sessionStorage.removeItem(ROLE_KEY);
    } catch {}
  }, []);

  return (
    <RoleContext.Provider value={{ role, setUserRole, clearRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
}
