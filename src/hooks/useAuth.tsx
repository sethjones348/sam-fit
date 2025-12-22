import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const loginFn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }
        const userData = await response.json();
        
        const userObj: User = {
          id: userData.sub,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
        };

        setUser(userObj);
        setToken(tokenResponse.access_token);
        sessionStorage.setItem('user', JSON.stringify(userObj));
        sessionStorage.setItem('token', tokenResponse.access_token);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    },
    onError: () => {
      console.error('Login failed');
    },
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login: loginFn,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

