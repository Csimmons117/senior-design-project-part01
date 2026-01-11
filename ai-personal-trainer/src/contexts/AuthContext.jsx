import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Try to refresh token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await api.post("/api/auth/refresh", {});
        if (data.accessToken && data.user) {
          setToken(data.accessToken);
          setUser(data.user);
        }
      } catch (e) {
        // No valid session, that's fine
        console.log("No existing session");
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Set up token refresh interval (refresh 1 min before expiry)
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(async () => {
      try {
        const data = await api.post("/api/auth/refresh", {});
        if (data.accessToken) {
          setToken(data.accessToken);
          if (data.user) setUser(data.user);
        }
      } catch (e) {
        console.error("Token refresh failed", e);
        logout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (token expires in 15)

    return () => clearInterval(refreshInterval);
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });
    if (data.accessToken && data.user) {
      setToken(data.accessToken);
      setUser(data.user);
      return { success: true };
    }
    throw new Error(data.error || "Login failed");
  }, []);

  const signup = useCallback(async (userData) => {
    const data = await api.post("/api/auth/signup", userData);
    if (data.accessToken && data.user) {
      setToken(data.accessToken);
      setUser(data.user);
      return { success: true };
    }
    throw new Error(data.error || "Signup failed");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch (e) {
      // Ignore logout errors
    }
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
