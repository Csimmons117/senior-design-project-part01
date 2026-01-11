import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { initializeAuth } from "./services/api";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import Layout from "./components/layout/Layout";
import ChatContainer from "./components/chat/ChatContainer";
import ProfilePage from "./components/profile/ProfilePage";
import "./index.css";

// Sync auth token with API service
function AuthSync({ children }) {
  const { token } = useAuth();

  useEffect(() => {
    initializeAuth(token);
  }, [token]);

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthSync>
          <UserProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<ChatContainer />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Routes>
          </UserProvider>
        </AuthSync>
      </AuthProvider>
    </BrowserRouter>
  );
}
