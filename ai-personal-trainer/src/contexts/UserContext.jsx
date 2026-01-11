import React, { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { user, updateUser, token } = useAuth();

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await api.get("/api/user/profile");
      if (data.user) {
        updateUser(data.user);
        return data.user;
      }
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    }
    return null;
  }, [token, updateUser]);

  const updateProfile = useCallback(async (profileData) => {
    const data = await api.put("/api/user/profile", profileData);
    if (data.user) {
      updateUser(data.user);
      return data.user;
    }
    throw new Error("Failed to update profile");
  }, [updateUser]);

  const updateAvatar = useCallback(async (avatarUrl) => {
    const data = await api.post("/api/user/avatar", { avatar_url: avatarUrl });
    if (data.user) {
      updateUser(data.user);
      return data.user;
    }
    throw new Error("Failed to update avatar");
  }, [updateUser]);

  const value = {
    user,
    refreshProfile,
    updateProfile,
    updateAvatar
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
