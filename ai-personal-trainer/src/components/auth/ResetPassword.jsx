import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setError("Missing reset token. Use the link sent to your email.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");

    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset Password</h2>
        {message && <div className="auth-info">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={isLoading || !token}>
            {isLoading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
