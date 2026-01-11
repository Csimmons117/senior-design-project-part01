import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [showDashboard, setShowDashboard] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* Menu Button */}
      <button
        className={`menu-item ${showDashboard ? "active" : ""}`}
        aria-label="Menu"
        onClick={() => setShowDashboard(!showDashboard)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
        </svg>

        {showDashboard && (
          <div className="dashboard-panel" onClick={(e) => e.stopPropagation()}>
            <button className="dashboard-item" onClick={() => { navigate("/"); setShowDashboard(false); }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              Home
            </button>
            <button className="dashboard-item" onClick={() => { navigate("/profile"); setShowDashboard(false); }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Profile
            </button>
            <button className="dashboard-item" onClick={() => { navigate("/"); setShowDashboard(false); }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Goals
            </button>
            <button className="dashboard-item" onClick={() => { navigate("/"); setShowDashboard(false); }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
              </svg>
              Help
            </button>
          </div>
        )}
      </button>

      {/* Camera Button */}
      <button
        className="menu-item"
        aria-label="Camera"
        onClick={() => {
          // Trigger camera modal - will be handled by ChatContainer
          window.dispatchEvent(new CustomEvent("openCamera"));
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
        </svg>
      </button>

      {/* Chat/Active Button */}
      <button
        className={`menu-item ${isActive("/") ? "active" : ""}`}
        onClick={() => navigate("/")}
      >
        <span>Chat</span>
      </button>
    </aside>
  );
}
