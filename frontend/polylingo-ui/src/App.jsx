import React, { useState } from "react";
import "./App.css";

import Dashboard from "./components/Dashboard";
import MemoryPanel from "./components/MemoryPanel";

function App() {
  const [selectedPersona, setSelectedPersona] = useState("friendly");

  // App-level memory hook: Dashboard will call onSaveMemory to persist
  const handleSaveMemory = (memory) => {
    // Append to localStorage with dedupe and keep newest first (max 50)
    const k = "polylingo_memories";
    const stored = JSON.parse(localStorage.getItem(k) || "[]");
    // avoid duplicates by id
    const exists = stored.find((s) => s.id === memory.id);
    const updated = exists ? stored : [memory, ...stored];
    localStorage.setItem(k, JSON.stringify(updated.slice(0, 50)));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">PolyLingo</h1>
      </header>

      <main className="App-main-content split">
        {/* Left: memories */}
        <aside className="sidebar">
          <MemoryPanel />
        </aside>

        {/* Right: main chat dashboard */}
        <section className="main-area">
          <Dashboard
            onSaveMemory={handleSaveMemory}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
