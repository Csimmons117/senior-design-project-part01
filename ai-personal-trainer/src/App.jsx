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
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("chat"); // "menu", "camera", or "chat"
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDashboard && !e.target.closest('.icon-btn')) {
        setShowDashboard(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDashboard]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeForm = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);

    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1000));
        const mockAnalysis = `Mock Form Analysis:\n\n✅ Good points:\n- Neutral spine position\n- Good depth\n\n⚠️ Areas to improve:\n- Keep chest more upright\n- Engage core throughout`;
        setMessages((m) => [...m, { role: "assistant", content: mockAnalysis }]);
        setShowCamera(false);
        setCapturedImage(null);
        return;
      }

      const res = await fetch(`${API_BASE}/api/analyze-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          prompt: "Analyze my exercise form and provide detailed feedback"
        }),
      });

      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      const data = await res.json();

      setMessages((m) => [...m, { role: "assistant", content: data?.reply ?? "No analysis available" }]);
      setShowCamera(false);
      setCapturedImage(null);
    } catch (e) {
      console.error("Analysis error:", e);
      const fallback = `Mock Form Analysis (fallback):\n\n✅ Good points:\n- Neutral spine position\n- Good depth\n\n⚠️ Areas to improve:\n- Keep chest more upright\n- Engage core throughout`;
      setMessages((m) => [...m, { role: "assistant", content: fallback }]);
      setShowCamera(false);
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <button
          className={`menu-item ${activeMenuItem === "menu" ? "active" : ""}`}
          aria-label="Menu"
          onClick={() => {
            setActiveMenuItem("menu");
            setShowDashboard(!showDashboard);
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
          </svg>

          {/* Dashboard Panel */}
          {showDashboard && (
            <div className="dashboard-panel" onClick={(e) => e.stopPropagation()}>
              <button className="dashboard-item" onClick={() => setShowDashboard(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Home
              </button>
              <button className="dashboard-item" onClick={() => setShowDashboard(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Goals
              </button>
              <button className="dashboard-item" onClick={() => setShowDashboard(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
                Reminders
              </button>
              <button className="dashboard-item" onClick={() => setShowDashboard(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                </svg>
                Help
              </button>
            </div>
          )}
        </button>

        <button
          className={`menu-item ${activeMenuItem === "camera" ? "active" : ""}`}
          aria-label="Camera"
          onClick={() => {
            setActiveMenuItem("camera");
            setShowCamera(true);
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
          </svg>
        </button>

        <button
          className={`menu-item ${activeMenuItem === "chat" ? "active" : ""}`}
          onClick={() => setActiveMenuItem("chat")}
        >
          <span>Chat</span>
        </button>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="brand">
            <div className="gpt-badge"><span>SRC</span></div>
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

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal" onClick={() => !isAnalyzing && setShowCamera(false)}>
          <div className="camera-content" onClick={(e) => e.stopPropagation()}>
            <div className="camera-header">
              <h2>Analyze Exercise Form</h2>
              <button className="close-btn" onClick={() => setShowCamera(false)} disabled={isAnalyzing}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {isAnalyzing ? (
              <div className="analyzing">
                <div className="analyzing-spinner"></div>
                <p>Analyzing your form...</p>
              </div>
            ) : (
              <>
                <div className="camera-preview">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured" />
                  ) : (
                    <p style={{ color: '#8e929a' }}>No image selected</p>
                  )}
                </div>

                <div className="camera-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <button
                    className="camera-btn secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
                    </svg>
                    Take/Upload Photo
                  </button>
                  <button
                    className="camera-btn primary"
                    onClick={analyzeForm}
                    disabled={!capturedImage}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Analyze Form
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageRow({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div className="avatar-sm" style={{ background: isUser ? "#ff3b3b" : "#1a1b20" }}>
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
