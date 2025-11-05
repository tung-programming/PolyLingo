import React, { useState } from "react";
import "./App.css";

import Dashboard from "./components/Dashboard";
import MemoryPanel from "./components/MemoryPanel";
import memory from "./services/memory";

function App() {
  const [selectedPersona, setSelectedPersona] = useState("friendly");
  const [memories, setMemories] = useState(
    JSON.parse(localStorage.getItem("polylingo_memories") || "[]")
  );
  const [selectedMemory, setSelectedMemory] = useState(null);

  // Save memory snapshots
  const handleSaveMemory = (memoryItem) => {
    if (!memoryItem || !memoryItem.preview) return;

    const existing = JSON.parse(
      localStorage.getItem("polylingo_memories") || "[]"
    );

    const isDuplicate = existing.some(
      (m) => m.preview === memoryItem.preview && m.time === memoryItem.time
    );
    if (isDuplicate) return;

    const updated = [memoryItem, ...existing].slice(0, 50);
    localStorage.setItem("polylingo_memories", JSON.stringify(updated));
    setMemories(updated);
  };

  // Load selected memory
  const handleSelectMemory = (memoryItem) => {
    if (!memoryItem) return;
    setSelectedMemory(memoryItem);
  };

  // Clear all memories (sidebar only)
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
        {/* Sidebar */}
        <aside className="sidebar">
          <MemoryPanel
            memories={memories}
            onSelectMemory={handleSelectMemory}
            onClearMemory={handleClearMemory}
          />
        </aside>

        {/* Main chat dashboard */}
        <section className="main-area">
          <Dashboard
            onSaveMemory={handleSaveMemory}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
            selectedMemory={selectedMemory}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
