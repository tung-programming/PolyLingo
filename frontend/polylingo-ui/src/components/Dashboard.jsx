import React, { useEffect, useRef, useState } from "react";
import { sendMessageToBot, synthesizeSpeech } from "../services/api";
import VoiceRecorder from "./VoiceRecorder";
import PersonaSelector from "./PersonaSelector";
import memory from "../services/memory";
import "../App.css";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";

/**
 * Dashboard.jsx (with Mood Visualizer)
 *
 * - Shows a small mood/emotion indicator when the bot responds.
 * - Indicator auto-hides after 5s.
 * - Inline styles used for the indicator so no CSS edits are necessary right now.
 */

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

  // Mood visualizer state
  const [currentEmotion, setCurrentEmotion] = useState(null); // { label, emoji, color }
  const emotionTimerRef = useRef(null);

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

  // Load selected memory instantly when chosen from sidebar
  useEffect(() => {
    if (selectedMemory && selectedMemory.chat) {
      setChatHistory(selectedMemory.chat);
    }
  }, [selectedMemory]);

  // Map emotion label to emoji + color + display label
  const getEmotionMeta = (emotion) => {
    if (!emotion) return { label: "Neutral", emoji: "😐", color: "#9aa4ad" };
    const e = emotion.toLowerCase();
    switch (e) {
      case "joy":
      case "happy":
      case "excited":
        return { label: "Joy", emoji: "😄", color: "#00e0ff" };
      case "sadness":
      case "sad":
        return { label: "Sad", emoji: "😢", color: "#3a6ee8" };
      case "anger":
      case "angry":
        return { label: "Angry", emoji: "😡", color: "#ff4d4d" };
      case "fear":
      case "anxious":
        return { label: "Fear", emoji: "😨", color: "#ffb300" };
      case "neutral":
      default:
        return { label: "Neutral", emoji: "😐", color: "#9aa4ad" };
    }
  };

  // Show an emotion badge for a few seconds
  const showEmotion = (emotionLabel) => {
    const meta = getEmotionMeta(emotionLabel);
    setCurrentEmotion(meta);

    // clear previous timer
    if (emotionTimerRef.current) {
      clearTimeout(emotionTimerRef.current);
    }

    // auto-hide after 5s
    emotionTimerRef.current = setTimeout(() => {
      setCurrentEmotion(null);
      emotionTimerRef.current = null;
    }, 5000);
  };

  // Core message handler
  const handleUserMessage = async (message) => {
    if (!message || !message.trim()) return;

    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setUserInput("");

    try {
      // Store user turn
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

      // Store bot turn
      memory.addTurn({
        role: "bot",
        text: botItem.text,
        lang: botItem.language,
        emotion: botItem.emotion,
      });

      // Update chat UI and memory panel snapshot
      setChatHistory((prev) => {
        const updated = [...prev, botItem];
        const memorySnapshot = {
          id: Date.now() + Math.random(),
          preview: (botItem.text || "").slice(0, 80),
          emotion: botItem.emotion,
          language: botItem.language,
          time: new Date().toLocaleTimeString(),
          chat: updated,
        };
        onSaveMemory?.(memorySnapshot);

        // show mood visualizer (use bot's detected emotion)
        showEmotion(botItem.emotion);

        return updated;
      });

      // Speak bot reply
      synthesizeSpeech(response.reply, response.language || "en");
    } catch (err) {
      console.error("sendMessageToBot error", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry — something went wrong." },
      ]);
      // show neutral/error emotion briefly
      showEmotion("neutral");
    } finally {
      setIsLoading(false);
    }
  };

  // UI handlers
  const handleSend = () => handleUserMessage(userInput);
  const handleVoiceInput = (text) => {
    if (text) handleUserMessage(text);
  };

  // Confirm modal + toast state & handlers
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

  // Inline styles for the mood indicator to ensure it shows correctly without editing CSS
  const moodBadgeStyle = currentEmotion
    ? {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.45)",
        color: "#fff",
        fontWeight: 700,
        boxShadow: `0 6px 20px ${currentEmotion.color}55, inset 0 0 10px ${currentEmotion.color}33`,
        border: `1px solid ${currentEmotion.color}55`,
        transform: "translateY(0)",
        transition: "transform 200ms ease, opacity 200ms ease",
        opacity: 1,
      }
    : {
        display: "none",
      };

  return (
    <div className="dashboard">
      {/* Persona selector + clear button + mood badge */}
      <div className="dashboard-topbar" style={{ alignItems: "center" }}>
        {/* Mood badge sits at left of persona selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className={`mood-badge ${!currentEmotion ? "hide" : ""}`}
            style={{
              border: `1px solid ${currentEmotion?.color || "#00bfff"}55`,
              boxShadow: `0 0 12px ${currentEmotion?.color || "#00bfff"}55`,
            }}
            aria-live="polite"
          >
            {currentEmotion && (
              <>
                <span style={{ fontSize: 18 }}>{currentEmotion.emoji}</span>
                <span style={{ fontSize: 13 }}>{currentEmotion.label}</span>
              </>
            )}
          </div>
        </div>

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
            key={`${i}-${m.sender}-${m.text?.slice(0, 10)}`}
            className={`chat-message ${m.sender === "user" ? "user-msg" : "bot-msg"}`}
          >
            <div className="bubble">
              <p>{m.text}</p>
              {m.sender === "bot" && (
                <small className="meta">
                  {m.language?.toUpperCase()} · {m.emotion?.toUpperCase()} · {m.persona?.toUpperCase()}
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

      {/* Confirmation modal */}
      <ConfirmModal
        show={showConfirm}
        message="Do you really want to clear all saved memories?"
        onConfirm={confirmClear}
        onCancel={cancelClear}
      />

      {/* Toast */}
      <Toast show={showToast} message="✅ Memories cleared successfully!" onClose={() => setShowToast(false)} />
    </div>
  );
};

export default Dashboard;
