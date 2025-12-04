import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

type User = {
  email: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'iwitness_auth_token';
const EMAIL_KEY = 'iwitness_auth_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Load from localStorage on startup
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedEmail = localStorage.getItem(EMAIL_KEY);
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUser({ email: storedEmail });
      apiClient.setToken(storedToken);
    }
  }, []);

  const signIn = async (email: string, _password: string) => {
    // TODO: replace with real Face 2 Face API call
    const fakeToken = 'face2face-demo-token';

    setToken(fakeToken);
    setUser({ email });

    localStorage.setItem(TOKEN_KEY, fakeToken);
    localStorage.setItem(EMAIL_KEY, email);

    // notify API client
    apiClient.setToken(fakeToken);
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);

    // clear token in API client
    apiClient.setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
