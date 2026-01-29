import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

interface User {
  id: number;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Optionally verify the token is still valid by fetching user info
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (!response.ok) {
            // Token is invalid, clear it
            throw new Error('Invalid token');
          }

          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // Token verification failed, clear session
          console.error('Token verification failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setAccessToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sign in');
      }

      const data = await response.json();
      const token = data.access_token;

      // Fetch actual user data using the token
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userObj: User = await userResponse.json();

      setAccessToken(token);
      setUser(userObj);

      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userObj));

    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to sign up');
      }

      // Auto login after signup
      await signIn(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
