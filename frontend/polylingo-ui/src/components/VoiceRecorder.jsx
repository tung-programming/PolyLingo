import React, { useState, useRef } from "react";
import { transcribeAudio } from "../services/api";

const VoiceRecorder = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleStartRecording = async () => {
    try {
      // Try to start local MediaRecorder (for visual feedback / optional upload)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // You can optionally do something with audioBlob (upload to backend)
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start browser speech recognition (this is independent of MediaRecorder)
      transcribeAudio()
        .then((transcript) => {
          if (onTranscription && typeof onTranscription === "function") {
            onTranscription(transcript);
          }
        })
        .catch((err) => {
          console.error("Error transcribing:", err);
        })
        .finally(() => {
          // stop media recorder if still running
          try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
          } catch (e) {}
          setIsRecording(false);
        });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleClick = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`voice-button ${isRecording ? "listening" : ""}`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording ? "🔴 Stop" : "🎤 Speak"}
    </button>
  );
};

export default VoiceRecorder;
