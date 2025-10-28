import React, { useEffect, useRef, useState } from "react";
import { sendMessageToBot, synthesizeSpeech } from "../services/api";
import VoiceRecorder from "./VoiceRecorder";
import PersonaSelector from "./PersonaSelector";
import memory from "../services/memory";
import "../App.css";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";

const Dashboard = ({
  onSaveMemory,
  selectedPersona,
  setSelectedPersona,
  selectedMemory,
  onClearMemory, // ✅ gets from App.jsx
}) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Preload TTS voices
  useEffect(() => {
    speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  // 🧠 Load selected memory instantly when chosen from sidebar
  useEffect(() => {
    if (selectedMemory && selectedMemory.chat) {
      setChatHistory(selectedMemory.chat);
    }
  }, [selectedMemory]);

  // 🔁 Core message handler
  const handleUserMessage = async (message) => {
    if (!message || !message.trim()) return;

    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setUserInput("");

    try {
      // 🧠 Store user turn
      memory.addTurn({ role: "user", text: message });

      const context = {
        shortterm: memory.getShortTerm(),
        facts: memory.getFacts(),
      };

      const response = await sendMessageToBot(
        message,
        "demo_user",
        selectedPersona,
        context
      );

      const botItem = {
        sender: "bot",
        text: response.reply,
        emotion: response.emotion?.label || "neutral",
        language: response.language || "en",
        persona: response.persona || selectedPersona,
      };

      // 🧠 Store bot turn
      memory.addTurn({
        role: "bot",
        text: botItem.text,
        lang: botItem.language,
        emotion: botItem.emotion,
      });

      // Update chat UI
      setChatHistory((prev) => {
        const updated = [...prev, botItem];
        const memorySnapshot = {
          id: Date.now() + Math.random(), // ✅ unique key
          preview: (botItem.text || "").slice(0, 80),
          emotion: botItem.emotion,
          language: botItem.language,
          time: new Date().toLocaleTimeString(),
          chat: updated,
        };
        onSaveMemory?.(memorySnapshot);
        return updated;
      });

      synthesizeSpeech(response.reply, response.language || "en");
    } catch (err) {
      console.error("sendMessageToBot error", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry — something went wrong." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // UI handlers
  const handleSend = () => handleUserMessage(userInput);
  const handleVoiceInput = (text) => {
    if (text) handleUserMessage(text);
  };

  const [showConfirm, setShowConfirm] = useState(false);
    const handleClearClick = () => {
    setShowConfirm(true);
  };
  const [showToast, setShowToast] = useState(false);
  const confirmClear = () => {
    onClearMemory();
    setChatHistory([]);
    setShowConfirm(false);
    setShowToast(true); 
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };

  return (
    <div className="dashboard">
      {/* Persona selector + clear button */}
      <div className="dashboard-topbar">
        <PersonaSelector
          selectedPersona={selectedPersona}
          onChange={setSelectedPersona}
        />
        <button
          onClick={handleClearClick}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "8px",
            padding: "6px 12px",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          🧹 Clear Memory
        </button>
      </div>

      {/* Chat Area */}
      <div ref={chatRef} className="chat-container">
        {chatHistory.length === 0 && !isLoading && (
          <div className="empty-chat-filler">
            <p style={{ color: "var(--muted)" }}>
              Say hi — type or use the mic to start talking.
            </p>
          </div>
        )}

        {chatHistory.map((m, i) => (
          <div
            key={`${i}-${m.sender}-${m.text?.slice(0, 10)}`} // ✅ unique key
            className={`chat-message ${
              m.sender === "user" ? "user-msg" : "bot-msg"
            }`}
          >
            <div className="bubble">
              <p>{m.text}</p>
              {m.sender === "bot" && (
                <small className="meta">
                  {m.language?.toUpperCase()} · {m.emotion?.toUpperCase()} ·{" "}
                  {m.persona?.toUpperCase()}
                </small>
              )}
            </div>
          </div>
        ))}

        {isLoading && <div className="loading">Thinking...</div>}
      </div>

      {/* Fixed bottom input */}
      <div className="fixed-bottom-bar">
        <div className="input-container">
          <input
            type="text"
            className="input-box"
            placeholder="Type your message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} className="send-btn">
            Send
          </button>
          <VoiceRecorder onTranscription={handleVoiceInput} />
        </div>
      </div>
      {/* 🧹 Custom confirmation modal */}
      <ConfirmModal
        show={showConfirm}
        message="Do you really want to clear all saved memories?"
        onConfirm={confirmClear}
        onCancel={cancelClear}
      />
      {/* ✅ Toast */}
      <Toast
        show={showToast}
        message="✅ Memories cleared successfully!"
        onClose={() => setShowToast(false)}
      />

    </div>
  );
};

export default Dashboard;
