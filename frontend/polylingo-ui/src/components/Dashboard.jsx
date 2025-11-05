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
}) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  const [currentEmotion, setCurrentEmotion] = useState(null);
  const emotionTimerRef = useRef(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Scroll to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory]);

  // Preload voices
  useEffect(() => {
    speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  // Load selected memory instantly when chosen
  useEffect(() => {
    if (selectedMemory && selectedMemory.chat) {
      setChatHistory(selectedMemory.chat);
    }
  }, [selectedMemory]);

  // Map emotion → emoji, color, label
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
      default:
        return { label: "Neutral", emoji: "😐", color: "#9aa4ad" };
    }
  };

  // Adaptive persona
  const adaptPersona = (emotion) => {
    const e = (emotion || "").toLowerCase();
    let newPersona = selectedPersona;

    if (e.includes("sad")) newPersona = "caring";
    else if (e.includes("joy") || e.includes("happy") || e.includes("excited"))
      newPersona = "witty";
    else if (e.includes("anger")) newPersona = "neutral";
    else if (e.includes("fear") || e.includes("anxious")) newPersona = "caring";
    else newPersona = "friendly";

    if (newPersona !== selectedPersona) {
      setSelectedPersona(newPersona);
      const personaLabels = {
        friendly: "Friendly 🤗",
        caring: "Caring 💖",
        witty: "Witty 😏",
        professional: "Professional 💼",
        neutral: "Neutral 🧘",
      };
      setToastMessage(
        `Persona adapted to ${personaLabels[newPersona]} (${e || "neutral"} mood detected)`
      );
      setShowToast(true);
    }
  };

  // Show emotion badge
  const showEmotion = (emotionLabel) => {
    const meta = getEmotionMeta(emotionLabel);
    setCurrentEmotion(meta);
    if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    emotionTimerRef.current = setTimeout(() => {
      setCurrentEmotion(null);
      emotionTimerRef.current = null;
    }, 5000);
  };

  // Handle sending messages
  const handleUserMessage = async (message) => {
    if (!message || !message.trim()) return;
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setUserInput("");

    try {
      memory.addTurn({ role: "user", text: message });
      const context = { shortterm: memory.getShortTerm(), facts: memory.getFacts() };
      const response = await sendMessageToBot(message, "demo_user", selectedPersona, context);

      const botItem = {
        sender: "bot",
        text: response.reply,
        emotion: response.emotion?.label || "neutral",
        language: response.language || "en",
        persona: response.persona || selectedPersona,
      };

      memory.addTurn({
        role: "bot",
        text: botItem.text,
        lang: botItem.language,
        emotion: botItem.emotion,
      });

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
        showEmotion(botItem.emotion);
        adaptPersona(botItem.emotion);
        return updated;
      });

      synthesizeSpeech(response.reply, response.language || "en");
    } catch (err) {
      console.error("sendMessageToBot error", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry — something went wrong." },
      ]);
      showEmotion("neutral");
    } finally {
      setIsLoading(false);
    }
  };

  // ✳️ Clear only chat (not sidebar memories)
  const handleClearChat = () => {
    setChatHistory([]);
    setToastMessage("🧹 Chat cleared successfully!");
    setShowToast(true);
  };

  const handleSend = () => handleUserMessage(userInput);
  const handleVoiceInput = (text) => text && handleUserMessage(text);

  return (
    <div className="dashboard">
      {/* Topbar */}
      <div className="dashboard-topbar" style={{ alignItems: "center" }}>
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

        <PersonaSelector selectedPersona={selectedPersona} onChange={setSelectedPersona} />

        <button
          onClick={handleClearChat}
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
          🧹 Clear Chat
        </button>
      </div>

      {/* Chat */}
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

      {/* Bottom input */}
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

      <Toast
        show={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default Dashboard;
