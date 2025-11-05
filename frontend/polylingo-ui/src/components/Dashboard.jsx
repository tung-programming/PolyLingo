import React, { useEffect, useRef, useState } from "react";
import { sendMessageToBot, synthesizeSpeech } from "../services/api";
import VoiceRecorder from "./VoiceRecorder";
import PersonaSelector from "./PersonaSelector";
import memory from "../services/memory";
import "../App.css";
import Toast from "./Toast";

/**
 * Dashboard.jsx
 * - Keeps existing chat + persona + language features
 * - Adds Memory-based recall: extracts facts from user messages and stores them
 * - Sends shortterm + facts to backend (unchanged behavior)
 */

const Dashboard = ({ onSaveMemory, selectedPersona, setSelectedPersona, selectedMemory }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  const [currentEmotion, setCurrentEmotion] = useState(null);
  const emotionTimerRef = useRef(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // scroll to bottom on change
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory]);

  useEffect(() => {
    if (selectedMemory && selectedMemory.chat) {
      setChatHistory(selectedMemory.chat);
    }
  }, [selectedMemory]);

  // emotion meta mapping (unchanged)
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

  // adapt persona (unchanged)
  const adaptPersona = (emotion) => {
    const e = (emotion || "").toLowerCase();
    let newPersona = selectedPersona;
    if (e.includes("sad")) newPersona = "caring";
    else if (e.includes("joy") || e.includes("happy") || e.includes("excited")) newPersona = "witty";
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
      setToastMessage(`Persona adapted to ${personaLabels[newPersona]} (${e || "neutral"} mood detected)`);
      setShowToast(true);
    }
  };

  const showEmotion = (emotionLabel) => {
    const meta = getEmotionMeta(emotionLabel);
    setCurrentEmotion(meta);
    if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    emotionTimerRef.current = setTimeout(() => {
      setCurrentEmotion(null);
      emotionTimerRef.current = null;
    }, 5000);
  };

  // Small language detection for typed input (keeps your current behavior if used elsewhere)
  const detectLanguage = (text) => {
    if (!text) return "en";
    const patterns = {
      fr: /[éèêàçùâîôëœ]|bonjour|merci|salut/i,
      es: /[ñáéíóú]|hola|gracias/i,
      hi: /[अ-ह]+|नमस्ते|धन्यवाद/i,
      ja: /[ぁ-んァ-ン一-龯]/,
      ko: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
      zh: /[\u4e00-\u9fa5]/,
      ar: /[\u0600-\u06FF]/,
      ru: /[А-яЁё]/,
      de: /[äöüß]|hallo|danke/i,
      it: /[àèéìíòóù]|ciao|grazie/i,
      pt: /[ãõáéíóú]|olá|obrigado/i,
    };
    for (const [lang, regex] of Object.entries(patterns)) {
      if (regex.test(text)) return lang;
    }
    return "en";
  };

  // The main sending flow - adds memory facts, sends context to backend, stores bot reply.
  const handleUserMessage = async (message) => {
    if (!message || !message.trim()) return;
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setUserInput("");

    try {
      // 1) add user turn to short-term memory (this will also auto-extract simple facts)
      memory.addTurn({ role: "user", text: message });

      // 1b) explicitly extract facts from this user message and add to memory (so facts persist)
      const extractedFromUser = memory.extractFacts(message);
      let newFactsCount = 0;
      for (const k of Object.keys(extractedFromUser)) {
        const v = extractedFromUser[k];
        if (v == null) continue;
        const before = memory.getFacts();
        // use addFact so it merges safely
        memory.addFact(k, v);
        const after = memory.getFacts();
        // detect if fact added (simple heuristic: key present in after but absent/changed before)
        if (!before[k] || JSON.stringify(before[k]) !== JSON.stringify(after[k])) newFactsCount++;
      }
      if (newFactsCount) {
        setToastMessage(`Saved ${newFactsCount} new fact(s) to memory.`);
        setShowToast(true);
      }

      // 2) prepare context for backend
      const context = { shortterm: memory.getShortTerm(), facts: memory.getFacts() };

      // 3) send message with context
      // Optionally, pass detected language as hint
      const detectedLang = detectLanguage(message);
      const response = await sendMessageToBot(message, "demo_user", selectedPersona, context, detectedLang);

      // 4) build bot item
      const botItem = {
        sender: "bot",
        text: response.reply,
        emotion: response.emotion?.label || "neutral",
        language: response.language || detectedLang || "en",
        persona: response.persona || selectedPersona,
      };

      // 5) save bot reply to short-term memory
      memory.addTurn({
        role: "bot",
        text: botItem.text,
        lang: botItem.language,
        emotion: botItem.emotion,
      });

      // 6) (Optional) extract facts from bot reply if they contain user-related facts (rare)
      const extractedFromBot = memory.extractFacts(botItem.text || "");
      let botFactCount = 0;
      for (const k of Object.keys(extractedFromBot)) {
        const v = extractedFromBot[k];
        if (v == null) continue;
        const before = memory.getFacts();
        memory.addFact(k, v);
        const after = memory.getFacts();
        if (!before[k] || JSON.stringify(before[k]) !== JSON.stringify(after[k])) botFactCount++;
      }
      if (botFactCount) {
        setToastMessage(`Memory updated with ${botFactCount} facts from conversation.`);
        setShowToast(true);
      }

      // 7) update UI chat and persist snapshot to memories sidebar
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

      // 8) speak
      synthesizeSpeech(response.reply, response.language || detectedLang || "en");
    } catch (err) {
      console.error("sendMessageToBot error", err);
      setChatHistory((prev) => [...prev, { sender: "bot", text: "Sorry — something went wrong." }]);
      showEmotion("neutral");
    } finally {
      setIsLoading(false);
    }
  };

  // UI helpers
  const handleSend = () => handleUserMessage(userInput);
  const handleVoiceInput = (text) => text && handleUserMessage(text);

  const handleClearChat = () => {
    setChatHistory([]);
    setToastMessage("🧹 Chat cleared successfully!");
    setShowToast(true);
  };

  return (
    <div className="dashboard">
      {/* topbar */}
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

      {/* chat */}
      <div ref={chatRef} className="chat-container">
        {chatHistory.length === 0 && !isLoading && (
          <div className="empty-chat-filler">
            <p style={{ color: "var(--muted)" }}>Say hi — type or use the mic to start talking.</p>
          </div>
        )}

        {chatHistory.map((m, i) => (
          <div key={`${i}-${m.sender}-${m.text?.slice(0, 10)}`} className={`chat-message ${m.sender === "user" ? "user-msg" : "bot-msg"}`}>
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

      {/* bottom input */}
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
          <button onClick={handleSend} className="send-btn">Send</button>
          <VoiceRecorder onTranscription={handleVoiceInput} />
        </div>
      </div>

      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    </div>
  );
};

export default Dashboard;
