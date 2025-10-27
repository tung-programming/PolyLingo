import React, { useEffect, useRef, useState } from "react";
import { sendMessageToBot, synthesizeSpeech } from "../services/api";
import VoiceRecorder from "./VoiceRecorder";
import PersonaSelector from "./PersonaSelector";
import "../App.css";

const Dashboard = ({ onSaveMemory, selectedPersona, setSelectedPersona }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    // Always scroll chat to bottom on new message
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  const handleUserMessage = async (message) => {
    if (!message || !message.trim()) return;
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setUserInput("");

    try {
      const response = await sendMessageToBot(message, "demo_user", selectedPersona);
      const botItem = {
        sender: "bot",
        text: response.reply,
        emotion: response.emotion?.label || "neutral",
        language: response.language || "en",
        persona: response.persona || selectedPersona,
      };

      setChatHistory((prev) => {
        const updated = [...prev, botItem];
        const memory = {
          id: Date.now(),
          preview: (response.reply || "").slice(0, 80),
          emotion: botItem.emotion,
          language: botItem.language,
          time: new Date().toLocaleTimeString(),
          chat: updated,
        };
        onSaveMemory?.(memory);
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

  const handleSend = () => handleUserMessage(userInput);
  const handleVoiceInput = (text) => {
    if (text) handleUserMessage(text);
  };

  return (
    <div className="dashboard">
      {/* Persona selector row above chat */}
      <div className="dashboard-topbar">
        <PersonaSelector
          selectedPersona={selectedPersona}
          onChange={setSelectedPersona}
        />
      </div>

      {/* Scrollable chat area */}
      <div ref={chatRef} className="chat-container">
        {chatHistory.length === 0 && (
          <div className="empty-chat-filler">
            <p style={{ color: "var(--muted)" }}>
              Say hi — type or use the mic to start talking.
            </p>
          </div>
        )}

        {chatHistory.map((m, i) => (
          <div
            key={i}
            className={`chat-message ${m.sender === "user" ? "user-msg" : "bot-msg"}`}
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

      {/* Fixed bottom bar */}
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
    </div>
  );
};

export default Dashboard;
