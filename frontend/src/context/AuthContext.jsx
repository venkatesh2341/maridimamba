import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, removeToken, getUser, setUser, removeUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setCurrentUser] = useState(getUser());
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setCurrentUser(profile);
          setUser(profile);
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setToken(res.token);
    setAuthToken(res.token);

    const userProfile = {
      id: res.id,
      username: res.username,
      fullName: res.fullName,
      role: res.role
    };

    setUser(userProfile);
    setCurrentUser(userProfile);
    return userProfile;
  };

  const logout = () => {
    removeToken();
    removeUser();
    setAuthToken(null);
    setCurrentUser(null);
  };

  const isLeader = user?.role === 'LEADER' || user?.role === 'ADMIN';
  const isMember = user?.role === 'MEMBER';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isLeader,
      isMember,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
