import React from "react";

const MemoryPanel = ({ memories = [], onSelectMemory, onClearMemory }) => {
  return (
    <div className="memory-panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.6rem",
        }}
      >
        <h2 className="memory-title">🧠 Memories</h2>
        <button
          onClick={onClearMemory}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "6px",
            padding: "4px 10px",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Clear
        </button>
      </div>

      <div className="memory-list-scroll">
        {memories.length === 0 && (
          <div className="memory-empty">No memories saved yet.</div>
        )}

        {memories.map((m, index) => (
          <div
            key={`${m.id || index}-${m.time || Math.random()}`} // ✅ truly unique
            className="memory-item"
            onClick={() => onSelectMemory(m)}
          >
            <div className="memory-meta">
              <span className="memory-time">{m.time}</span>
              <span className="memory-lang">
                {m.language?.toUpperCase() || "—"}
              </span>
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
