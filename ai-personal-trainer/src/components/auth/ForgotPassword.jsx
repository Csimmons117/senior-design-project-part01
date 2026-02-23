import React, { useState } from "react";
import { api } from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const data = await api.post("/api/auth/forgot-password", { email });
      if (data.resetUrl) {
        setMessage(
          `Development reset URL: ${data.resetUrl}. Use it to reset your password.`
        );
      } else {
        setMessage("If an account exists for that email, a reset link has been sent.");
      }
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p>Enter your CSUN email and we'll send a password reset link.</p>

        {message && <div className="auth-info">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">CSUN Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@csun.edu"
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Requesting..." : "Request reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
