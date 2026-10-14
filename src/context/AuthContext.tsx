import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, removeToken, getToken } from '../api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  department: string;
  semester?: string;
  section?: string;
  teacher_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  quickLogin: (role: 'admin' | 'teacher' | 'student') => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Failed to verify token on boot:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return res.user;
  };

  const quickLogin = async (role: 'admin' | 'teacher' | 'student'): Promise<User> => {
    let email = 'admin@college.edu';
    let password = 'Admin@123';

    if (role === 'teacher') {
      email = 'sharma@college.edu';
      password = 'Teacher@123';
    } else if (role === 'student') {
      email = 'student1@college.edu';
      password = 'Student@123';
    }

    return login(email, password);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
