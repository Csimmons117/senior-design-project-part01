import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";

export default function ProfilePage() {
  const { user, updateProfile, updateAvatar } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    height_cm: "",
    weight_kg: "",
    fitness_goal: "",
    experience_level: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        height_cm: user.height_cm || "",
        weight_kg: user.weight_kg || "",
        fitness_goal: user.fitness_goal || "",
        experience_level: user.experience_level || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await updateProfile({
        name: formData.name,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        fitness_goal: formData.fitness_goal || null,
        experience_level: formData.experience_level || null
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} />
              ) : (
                <span>{getInitials(user?.name)}</span>
              )}
            </div>
            <div className="profile-identity">
              <h1>{user?.name}</h1>
              <p>{user?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-section">
            <h2>Personal Information</h2>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

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
          </div>

          <div className="form-section">
            <h2>Fitness Profile</h2>

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
          </div>

          <button type="submit" className="profile-submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
