import React, { useEffect, useRef, useState } from "react";
import "./index.css";

// ⬇️ Start empty: no auto assistant reply
const initialMessages = [];

const MOCK_MODE = String(import.meta.env.VITE_AI_MOCK || "").toLowerCase() === "true";
const API_BASE = import.meta.env.VITE_API_BASE || ""; // leave empty to use Vite proxy

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function mockReply(userMsg) {
    const options = [
      `Mock: got **"${userMsg}"**.\nTry:\n1. **Barbell Squats** (3x8–10)\n2. **Leg Press** (3x10–12)\n3. **RDLs** (3x10–12)`,
      `Mock: "${userMsg}" received. Warm-up → compounds → accessories → cool-down.`,
      `Mock: For "${userMsg}", aim for ~2,300 kcal today. Need macros?`,
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setIsSending(true);

    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 400));
        setMessages((m) => [...m, { role: "assistant", content: mockReply(text) }]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data?.reply ?? "No reply" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Mock (fallback): ${mockReply(text)}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <button className="icon-btn" aria-label="Menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
          </svg>
        </button>

        <button className="icon-btn" aria-label="Camera">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
          </svg>
        </button>

        <button className="menu-item active">
          <span>Active</span>
        </button>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="brand">
            <div className="gpt-badge"><span>CSUN</span></div>
            <span className="brand-title">CSUN</span>
          </div>
        </header>

        <section className="content">
          {/* Chat feed */}
          <div className="chat-feed">
            {/* ⬇️ Only render the white chat card after there are messages */}
            {messages.length > 0 && (
              <div className="chat-card">
                {messages.map((m, i) => (
                  <MessageRow key={i} role={m.role} content={m.content} />
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Bottom composer */}
          <div className="composer">
            <div className={`composer-shell ${isSending ? "busy" : ""}`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message GPT…"
                rows={1}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={isSending || !input.trim()}
                title="Send (Enter)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M2 21l20-9L2 3v7l14 2-14 2z" />
                </svg>
              </button>
            </div>
            <div className="hint">
              Press <kbd>Enter</kbd> to send • <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MessageRow({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div className="avatar-sm" style={{ background: isUser ? "#2a6cff" : "#1a1b20" }}>
        {isUser ? "U" : "A"}
      </div>
      <div
        className="bubble bubble-text"
        dangerouslySetInnerHTML={{
          __html: content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>"),
        }}
      />
    </div>
  );
}
