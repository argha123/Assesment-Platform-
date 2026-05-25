import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on app load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // React to localStorage changes (e.g. profile updates from Account page)
  useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem('auth_user');
        if (stored) setUser(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await apiRegister(data);
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
