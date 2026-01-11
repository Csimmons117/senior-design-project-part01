import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { highlightExercises } from "../../utils/formatters";

export default function MessageRow({ role, content }) {
  const { user } = useAuth();
  const isUser = role === "user";

  // Get initials for user avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Process content for display
  const processContent = (text) => {
    // First highlight exercises (makes them red)
    let processed = highlightExercises(text);
    // Then handle bold markdown
    processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Handle line breaks
    processed = processed.replace(/\n/g, "<br/>");
    return processed;
  };

  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div
        className="avatar-sm"
        style={{ background: isUser ? "#ff3b3b" : "#1a1b20" }}
      >
        {isUser ? (
          user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="avatar-img" />
          ) : (
            getInitials(user?.name)
          )
        ) : (
          "A"
        )}
      </div>
      <div
        className="bubble bubble-text"
        dangerouslySetInnerHTML={{ __html: processContent(content) }}
      />
    </div>
  );
}
