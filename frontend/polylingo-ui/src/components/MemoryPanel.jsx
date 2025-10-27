import React, { useEffect, useState } from "react";

const MemoryPanel = () => {
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("polylingo_memories") || "[]");
    // dedupe by id and keep order
    const deduped = [];
    const seen = new Set();
    for (const m of stored) {
      if (!seen.has(m.id)) {
        deduped.push(m);
        seen.add(m.id);
      }
    }
    setMemories(deduped.slice(0, 100));
  }, []);

  // small helper to open a memory (replace the current chat)
  const openMemory = (mem) => {
    // store selection pointer in localStorage - Dashboard could optionally read on mount
    localStorage.setItem("polylingo_selected_memory", JSON.stringify(mem));
    // also visually highlight? for now we just console log
    // If you want Dashboard to load this automatically, we can wire it to listen to that key
    window.alert("Memory selected. (Dashboard will read this on next load if implemented.)");
  };

  return (
    <div className="memory-panel">
      <h2 className="memory-title">🧠 Memories</h2>

      <div className="memory-list-scroll">
        {memories.length === 0 && <div className="memory-empty">No memories saved yet.</div>}

        {memories.map((m) => (
          <div className="memory-item" key={m.id} onClick={() => openMemory(m)}>
            <div className="memory-meta">
              <span className="memory-time">{m.time}</span>
              <span className="memory-lang">{(m.language || "—").toUpperCase()}</span>
              <span className={`memory-emotion ${m.emotion}`}>{m.emotion}</span>
            </div>
            <div className="memory-preview">{m.preview}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryPanel;
