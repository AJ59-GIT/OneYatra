
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { initAuthListener, logoutUser } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isAuthReady: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: Initializing auth listener...");
    const unsubscribe = initAuthListener((profile, rawUser) => {
      console.log("AuthProvider: Auth state changed.", { hasProfile: !!profile, hasRawUser: !!rawUser });
      setUser(profile);
      setFirebaseUser(rawUser);
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    isLoggedIn: !!firebaseUser && user?.isActive !== false,
    isAdmin: user?.role === 'ADMIN' && user?.isActive !== false,
    isAuthReady,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
