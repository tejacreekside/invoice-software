import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  businessName?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  setToken: (value: string | null) => void;
  setUser: (value: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return window.localStorage.getItem('invoice_token');
  });
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem('invoice_token', token);
    } else {
      window.localStorage.removeItem('invoice_token');
    }
    setAuthToken(token);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      setToken: setTokenState,
      setUser: setUserState,
      logout: () => {
        setTokenState(null);
        setUserState(null);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
