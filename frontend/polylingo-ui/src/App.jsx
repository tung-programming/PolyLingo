import React, { useState } from "react";
import "./App.css";

import Dashboard from "./components/Dashboard";
import MemoryPanel from "./components/MemoryPanel";
import memory from "./services/memory"; // 🧠 import memory service

function App() {
  const [selectedPersona, setSelectedPersona] = useState("friendly");
  const [memories, setMemories] = useState(
    JSON.parse(localStorage.getItem("polylingo_memories") || "[]")
  );
  const [selectedMemory, setSelectedMemory] = useState(null);

  // 🧠 Save memory snapshots, avoid duplicates
  const handleSaveMemory = (memoryItem) => {
    if (!memoryItem || !memoryItem.preview) return;

    const existing = JSON.parse(
      localStorage.getItem("polylingo_memories") || "[]"
    );

    // Check if the preview already exists (avoid duplicates)
    const isDuplicate = existing.some(
      (m) => m.preview === memoryItem.preview && m.time === memoryItem.time
    );
    if (isDuplicate) return;

    const updated = [memoryItem, ...existing].slice(0, 50);
    localStorage.setItem("polylingo_memories", JSON.stringify(updated));
    setMemories(updated);
  };

  // 🧠 When a memory is selected from sidebar, load it in Dashboard instantly
  const handleSelectMemory = (memoryItem) => {
    if (!memoryItem) return;
    setSelectedMemory(memoryItem);
  };

  // 🧹 Clear all stored memories (UI + storage + short-term)
  const handleClearMemory = () => {
    memory.clear();
    localStorage.removeItem("polylingo_memories");
    setMemories([]);
    setSelectedMemory(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">PolyLingo</h1>
      </header>

      <main className="App-main-content split">
        {/* Left: memory panel */}
        <aside className="sidebar">
          <MemoryPanel
            memories={memories}
            onSelectMemory={handleSelectMemory}
            onClearMemory={handleClearMemory}
          />
        </aside>

        {/* Right: dashboard */}
        <section className="main-area">
          <Dashboard
            onSaveMemory={handleSaveMemory}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
            selectedMemory={selectedMemory}
            onClearMemory={handleClearMemory}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
