import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * AuthContext provides authentication state, role-based access utilities,
 * and login/logout actions for the application. Session is persisted in localStorage.
 */

const STORAGE_KEY = 'auth.session.v1';

// PUBLIC_INTERFACE
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

const defaultAuth = {
  isAuthenticated: false,
  user: null, // { name, role }
  token: null,
};

// Derive API base from provided env vars without introducing new ones.
const getApiBase = () => {
  const a = process.env.REACT_APP_API_BASE || '';
  const b = process.env.REACT_APP_BACKEND_URL || '';
  return a || b || '';
};

const AuthContext = createContext({
  ...defaultAuth,
  // PUBLIC_INTERFACE
  login: async (username, password, role) => {},
  // PUBLIC_INTERFACE
  logout: () => {},
  // PUBLIC_INTERFACE
  hasRole: (role) => false,
  // PUBLIC_INTERFACE
  hasAnyRole: (roles) => false,
});

/**
 * Attempt to call backend login if API base is set, else fallback to mock.
 * Backend is expected to return: { user: { name, role }, token }
 */
async function tryBackendLogin(username, password) {
  const base = getApiBase();
  if (!base) return null;

  const url = `${base.replace(/\/$/, '')}/auth/login`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.user && data.token) {
      return data;
    }
    return null;
  } catch (_e) {
    // Fallback to mock if backend is not available
    return null;
  }
}

/**
 * Generates a robust mock session if backend isn't available.
 */
function createMockSession(username, role) {
  const safeRole =
    role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.EMPLOYEE
      ? role
      : ROLES.EMPLOYEE;
  return {
    user: { name: username || 'User', role: safeRole },
    token: 'mock-token-' + Math.random().toString(36).slice(2),
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user && parsed.token) {
          return { isAuthenticated: true, user: parsed.user, token: parsed.token };
        }
      }
    } catch {}
    return { ...defaultAuth };
  });

  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: state.user, token: state.token })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.isAuthenticated, state.user, state.token]);

  // PUBLIC_INTERFACE
  const login = async (username, password, role) => {
    // Try backend login if configured; else use mock
    const backendSession = await tryBackendLogin(username, password);
    const session = backendSession || createMockSession(username, role);

    setState({ isAuthenticated: true, user: session.user, token: session.token });
    return session;
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    setState({ ...defaultAuth });
  };

  // PUBLIC_INTERFACE
  const hasRole = (role) => {
    if (!state.isAuthenticated || !state.user) return false;
    return state.user.role === role;
  };

  // PUBLIC_INTERFACE
  const hasAnyRole = (roles) => {
    if (!state.isAuthenticated || !state.user) return false;
    if (!Array.isArray(roles)) return false;
    return roles.includes(state.user.role);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.token,
      login,
      logout,
      hasRole,
      hasAnyRole,
    }),
    [state.isAuthenticated, state.user, state.token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to consume AuthContext safely. */
  return useContext(AuthContext);
}
