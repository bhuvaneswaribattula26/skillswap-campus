import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('skillswap_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await client.get('/users/me/full');
      setUser(data.user);
    } catch {
      localStorage.removeItem('skillswap_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('skillswap_token', data.token);
    await loadMe();
  }

  async function register(payload) {
    const { data } = await client.post('/auth/register', payload);
    localStorage.setItem('skillswap_token', data.token);
    await loadMe();
  }

  function logout() {
    localStorage.removeItem('skillswap_token');
    setUser(null);
  }

  async function refreshUser() {
    await loadMe();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
