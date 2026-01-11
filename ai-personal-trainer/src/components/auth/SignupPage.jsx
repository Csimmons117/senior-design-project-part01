import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    height_cm: "",
    weight_kg: "",
    fitness_goal: "",
    experience_level: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Account, 2: Profile

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError("Please fill in all required fields");
      return false;
    }
    if (!formData.email.endsWith("@csun.edu") && !formData.email.endsWith("@my.csun.edu")) {
      setError("Please use your CSUN email address");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const submitData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        fitness_goal: formData.fitness_goal || null,
        experience_level: formData.experience_level || null
      };

      await signup(submitData);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="gpt-badge"><span>SRC</span></div>
            <span className="brand-title">CSUN</span>
          </div>
          <h1>Create Account</h1>
          <p>{step === 1 ? "Set up your login credentials" : "Tell us about your fitness goals"}</p>
        </div>

        <div className="step-indicator">
          <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">CSUN Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="yourname@csun.edu"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button type="submit" className="auth-submit">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="height_cm">Height (cm)</label>
                <input
                  id="height_cm"
                  name="height_cm"
                  type="number"
                  value={formData.height_cm}
                  onChange={handleChange}
                  placeholder="175"
                  min="100"
                  max="250"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight_kg">Weight (kg)</label>
                <input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  placeholder="70"
                  min="30"
                  max="300"
                  step="0.1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fitness_goal">Fitness Goal</label>
              <select
                id="fitness_goal"
                name="fitness_goal"
                value={formData.fitness_goal}
                onChange={handleChange}
              >
                <option value="">Select your goal</option>
                <option value="Build muscle">Build muscle</option>
                <option value="Lose weight">Lose weight</option>
                <option value="Improve endurance">Improve endurance</option>
                <option value="Increase flexibility">Increase flexibility</option>
                <option value="General fitness">General fitness</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="experience_level">Experience Level</label>
              <select
                id="experience_level"
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
              >
                <option value="">Select your level</option>
                <option value="Beginner">Beginner (0-1 years)</option>
                <option value="Intermediate">Intermediate (1-3 years)</option>
                <option value="Advanced">Advanced (3+ years)</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="auth-back" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
