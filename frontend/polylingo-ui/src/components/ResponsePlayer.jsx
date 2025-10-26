import React, { useState } from "react";
import { synthesizeSpeech } from "../services/api";

const ResponsePlayer = ({ text, language = "en" }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (!text) return;

    try {
      const utt = synthesizeSpeech(text, language);
      if (!utt) return;

      setIsPlaying(true);
      utt.onend = () => setIsPlaying(false);
      utt.onerror = () => setIsPlaying(false);
    } catch (err) {
      console.error("Error playing response:", err);
      setIsPlaying(false);
    }
  };

  return (
    <div>
      <button onClick={handlePlay} disabled={!text || isPlaying}>
        {isPlaying ? "Playing..." : "Play Response"}
      </button>
    </div>
  );
};

export default ResponsePlayer;
