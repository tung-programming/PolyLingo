import React, { useState, useEffect } from "react";
import { sendMessageToBot, synthesizeSpeech } from "../services/api";
import ResponsePlayer from "./ResponsePlayer";
import VoiceRecorder from "./VoiceRecorder";
import PersonaSelector from "./PersonaSelector";
import "../App.css";

const Dashboard = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("friendly");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
  // 🔊 Preload speech synthesis voices early to avoid first-call lag
  speechSynthesis.getVoices();

  // 🧠 Some browsers (like Chrome) need this trick to ensure they actually load
  window.speechSynthesis.onvoiceschanged = () => {
    console.log("✅ Voices loaded:", speechSynthesis.getVoices().length);
  };
}, []);

  // 🧠 Core message handler (connects to backend)
  const handleUserMessage = async (message) => {
    if (!message || !message.toString().trim()) return;
    setIsLoading(true);

    try {
      const response = await sendMessageToBot(message, "demo_user", selectedPersona);

      setChatHistory((prev) => [
        ...prev,
        { sender: "user", text: message },
        {
          sender: "bot",
          text: response.reply,
          emotion: response.emotion?.label,
          language: response.language,
          persona: response.persona,
          mood: response.mood,
        },
      ]);

      // 🎙️ Automatically play the bot’s reply using browser TTS
      if (response.reply) {
        // response.language may be like "en" or "es" - pass it if available
        try {
          synthesizeSpeech(response.reply, response.language || "en");
          console.log(response.language);
        } catch (err) {
          console.error("TTS error:", err);
        }
      }
    } catch (error) {
      console.error("❌ Chat Error:", error);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  // 🗣️ Triggered when user sends a text message
  const handleSendClick = () => handleUserMessage(userInput);

  // 🎤 Triggered when speech-to-text returns transcribed message
  const handleVoiceInput = (transcribedText) => {
    if (transcribedText) handleUserMessage(transcribedText);
  };

  return (
    <div className="dashboard">
      <h1 className="title">PolyLingo – Multilingual Voice Chatbot 🌍</h1>

      <PersonaSelector
        selectedPersona={selectedPersona}
        onChange={(persona) => setSelectedPersona(persona)}
      />

      <div className="chat-container">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender === "user" ? "user-msg" : "bot-msg"}`}
          >
            <div className="bubble">
              <p>{msg.text}</p>
              {msg.sender === "bot" && (
                <small className="meta">
                  {msg.language?.toUpperCase()} · {msg.emotion?.toUpperCase()} · {msg.persona?.toUpperCase()}
                </small>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendClick()}
          className="input-box"
        />
        <button onClick={handleSendClick} className="send-btn">
          Send
        </button>
      </div>

      {/* VoiceRecorder uses onTranscription prop name */}
      <VoiceRecorder onTranscription={handleVoiceInput} />
    </div>
  );
};


export default Dashboard;
