import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import Dashboard from './components/Dashboard';
import PersonaSelector from './components/PersonaSelector';
import VoiceRecorder from './components/VoiceRecorder';
import ResponsePlayer from './components/ResponsePlayer';
import { processNlp } from './services/api';

function App() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I am PolyLingo, your multilingual persona voice buddy. How can I help you today?' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('friendly');
  const [botResponseText, setBotResponseText] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = currentInput.trim();
    if (!text) return;

    setMessages(prev => [...prev, { type: 'user', text }]);
    setCurrentInput('');

    try {
      const response = await processNlp(text, selectedPersona, 'user123'); // user_id is hardcoded for now
      const { response: botResponse, emotion, mood_update } = response.data;
      setMessages(prev => [...prev, { type: 'bot', text: botResponse, emotion, mood_update }]);
      setBotResponseText(botResponse);
    } catch (error) {
      console.error('Error processing NLP:', error);
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, something went wrong.' }]);
    }
  };

  const handleSpeechRecognized = (text) => {
    if (text) {
      setCurrentInput(text);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">PolyLingo</h1>
      </header>

      <main className="App-main-content">
        <Dashboard messages={messages} messagesEndRef={messagesEndRef} />
      </main>

      {/* <footer className="App-footer">
        <form onSubmit={handleSendMessage} className="input-container">
          <input
            type="text"
            className="text-input"
            placeholder="Type your message or use voice..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
          />
          <VoiceRecorder onSpeechRecognized={handleSpeechRecognized} />
          <button type="submit" className="voice-button" aria-label="Send message">➤</button>
        </form>
        <ResponsePlayer text={botResponseText} />
        <PersonaSelector
          selectedPersona={selectedPersona}
          setSelectedPersona={setSelectedPersona}
        />
      </footer> */}
    </div>
  );
}

export default App;