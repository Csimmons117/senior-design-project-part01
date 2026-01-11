import React, { useState } from "react";

export default function Composer({ onSend, isSending }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isSending) {
      onSend(input.trim());
      setInput("");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="composer">
      <div className={`composer-shell ${isSending ? "busy" : ""}`}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message GPT..."
          rows={1}
          disabled={isSending}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          title="Send (Enter)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M2 21l20-9L2 3v7l14 2-14 2z" />
          </svg>
        </button>
      </div>
      <div className="hint">
        Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line
      </div>
    </div>
  );
}
