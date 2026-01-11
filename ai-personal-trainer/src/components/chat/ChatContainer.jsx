import React, { useEffect, useRef, useState } from "react";
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
  const endRef = useRef(null);
  const { token } = useAuth();

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

  const sendMessage = async (text) => {
    if (!text.trim() || isSending) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setIsSending(true);

    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 400));
        setMessages((m) => [...m, { role: "assistant", content: mockReply(text) }]);
        return;
      }

      const data = await api.post("/api/chat", { message: text });
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "No reply" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Mock (fallback): ${mockReply(text)}` }
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
        setMessages((m) => [...m, { role: "assistant", content: mockAnalysis }]);
        return;
      }

      const data = await api.post("/api/analyze-form", { image: imageData, prompt });
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "No analysis available" }]);
    } catch (e) {
      const fallback = `Mock Form Analysis (fallback):\n\nGood points:\n- Neutral spine position\n- Good depth\n\nAreas to improve:\n- Keep chest more upright\n- Engage core throughout`;
      setMessages((m) => [...m, { role: "assistant", content: fallback }]);
    } finally {
      setIsSending(false);
      setShowCamera(false);
    }
  };

  return (
    <>
      <div className="chat-feed">
        {messages.length > 0 && (
          <div className="chat-card">
            {messages.map((m, i) => (
              <MessageRow key={i} role={m.role} content={m.content} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <Composer onSend={sendMessage} isSending={isSending} />

      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onAnalyze={handleFormAnalysis}
        />
      )}
    </>
  );
}
