// src/auth/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, type AffiliateProfile } from '../lib/apiClient';

type AuthUser = {
  email: string;
  affiliateId: string;
  referralUrl: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = useCallback(async (email: string, _password?: string) => {
    // Later: plug in real auth. For now, any email/password is accepted.
    apiClient.setToken('mock-token');

    // Every user automatically gets an affiliate profile
    const affiliate: AffiliateProfile = await apiClient.getOrCreateAffiliate({ email });

    setUser({
      email,
      affiliateId: affiliate.affiliate_id,
      referralUrl: affiliate.referral_url,
    });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    apiClient.setToken(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
