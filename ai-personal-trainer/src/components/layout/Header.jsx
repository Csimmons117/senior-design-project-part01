import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="gpt-badge"><span>SRC</span></div>
        <span className="brand-title">CSUN</span>
      </div>

      {user && (
        <div className="header-user">
          <div className="user-info" onClick={() => navigate("/profile")}>
            <span className="user-name">{user.name}</span>
            {user.height_cm && (
              <span className="user-stat">{user.height_cm} cm</span>
            )}
          </div>

          <div className="user-avatar" onClick={() => navigate("/profile")}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="avatar-photo" />
            ) : (
              <div className="avatar-initial">{getInitials(user.name)}</div>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
