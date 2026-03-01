import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import MessageRow from "./MessageRow";
import Composer from "./Composer";
import CameraModal from "../camera/CameraModal";

const MOCK_MODE = String(import.meta.env.VITE_AI_MOCK || "").toLowerCase() === "true";

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const endRef = useRef(null);
  const messageRefs = useRef({});
  const { token, isAuthenticated } = useAuth();

  // Load persisted chat history for logged-in users
  useEffect(() => {
    const loadHistory = async () => {
      if (!isAuthenticated || !token || MOCK_MODE) {
        setMessages([]);
        return;
      }

      try {
        const data = await api.get("/api/chat/history");
        const history = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(
          history.map((m, i) => ({
            id: `history-${m.createdAt || Date.now()}-${i}`,
            role: m.role,
            content: m.content,
            createdAt: Number(m.createdAt) || Math.floor(Date.now() / 1000)
          }))
        );
      } catch (e) {
        // If history load fails, keep chat usable with an empty timeline
        setMessages([]);
      }
    };

    loadHistory();
  }, [isAuthenticated, token]);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for camera open event from sidebar
  useEffect(() => {
    const handleOpenCamera = () => setShowCamera(true);
    window.addEventListener("openCamera", handleOpenCamera);
    return () => window.removeEventListener("openCamera", handleOpenCamera);
  }, []);

  function mockReply(userMsg) {
    const options = [
      `Mock: got **"${userMsg}"**.\nTry:\n1. **Barbell Squats** (3x8-10)\n2. **Leg Press** (3x10-12)\n3. **Romanian Deadlifts** (3x10-12)`,
      `Mock: "${userMsg}" received. Warm-up -> compounds -> accessories -> cool-down.`,
      `Mock: For "${userMsg}", aim for ~2,300 kcal today. Need macros?`
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  const latestHistories = useMemo(() => {
    const userMessages = messages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => message.role === "user");

    return userMessages
      .slice(-5)
      .reverse()
      .map(({ message, index }) => ({
        id: message.id || `history-item-${index}`,
        messageIndex: index,
        preview: String(message.content || "").slice(0, 56),
        createdAt: message.createdAt || Math.floor(Date.now() / 1000)
      }));
  }, [messages]);

  const jumpToHistory = (item) => {
    setSelectedHistoryId(item.id);
    const target = messageRefs.current[item.messageIndex];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isSending) return;

    const now = Math.floor(Date.now() / 1000);
    const userMsgId = `local-user-${Date.now()}`;

    setMessages((m) => [
      ...m,
      { id: userMsgId, role: "user", content: text, createdAt: now }
    ]);
    setSelectedHistoryId(userMsgId);
    setIsSending(true);

    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 400));
        setMessages((m) => [
          ...m,
          {
            id: `local-assistant-${Date.now()}`,
            role: "assistant",
            content: mockReply(text),
            createdAt: Math.floor(Date.now() / 1000)
          }
        ]);
        return;
      }

      const data = await api.post("/api/chat", { message: text });
      setMessages((m) => [
        ...m,
        {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: data?.reply || "No reply",
          createdAt: Math.floor(Date.now() / 1000)
        }
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: `Mock (fallback): ${mockReply(text)}`,
          createdAt: Math.floor(Date.now() / 1000)
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormAnalysis = async (imageData, prompt) => {
    setIsSending(true);
    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1000));
        const mockAnalysis = `Mock Form Analysis:\n\nGood points:\n- Neutral spine position\n- Good depth\n\nAreas to improve:\n- Keep chest more upright\n- Engage core throughout`;
        setMessages((m) => [
          ...m,
          {
            id: `analysis-assistant-${Date.now()}`,
            role: "assistant",
            content: mockAnalysis,
            createdAt: Math.floor(Date.now() / 1000)
          }
        ]);
        return;
      }

      const data = await api.post("/api/analyze-form", { image: imageData, prompt });
      setMessages((m) => [
        ...m,
        {
          id: `analysis-assistant-${Date.now()}`,
          role: "assistant",
          content: data?.reply || "No analysis available",
          createdAt: Math.floor(Date.now() / 1000)
        }
      ]);
    } catch (e) {
      const fallback = `Mock Form Analysis (fallback):\n\nGood points:\n- Neutral spine position\n- Good depth\n\nAreas to improve:\n- Keep chest more upright\n- Engage core throughout`;
      setMessages((m) => [
        ...m,
        {
          id: `analysis-assistant-${Date.now()}`,
          role: "assistant",
          content: fallback,
          createdAt: Math.floor(Date.now() / 1000)
        }
      ]);
    } finally {
      setIsSending(false);
      setShowCamera(false);
    }
  };

  return (
    <>
      <div className="chat-layout">
        <aside className="chat-history-panel" aria-label="Recent chat history">
          <div className="chat-history-title">Recent Chats</div>
          {latestHistories.length === 0 ? (
            <div className="chat-history-empty">No saved chats yet.</div>
          ) : (
            latestHistories.map((item) => (
              <button
                key={item.id}
                className={`chat-history-item ${selectedHistoryId === item.id ? "active" : ""}`}
                onClick={() => jumpToHistory(item)}
                type="button"
              >
                <div className="chat-history-preview">
                  {item.preview}
                  {item.preview.length >= 56 ? "..." : ""}
                </div>
                <div className="chat-history-time">
                  {new Date(item.createdAt * 1000).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </aside>

        <div className="chat-main-column">
          <div className="chat-feed">
            {messages.length > 0 && (
              <div className="chat-card">
                {messages.map((m, i) => (
                  <div
                    key={m.id || i}
                    ref={(el) => {
                      if (el) messageRefs.current[i] = el;
                    }}
                  >
                    <MessageRow role={m.role} content={m.content} />
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <Composer onSend={sendMessage} isSending={isSending} />
        </div>
      </div>

      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onAnalyze={handleFormAnalysis}
        />
      )}
    </>
  );
}
