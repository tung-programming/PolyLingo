import React, { useState, useRef, useEffect } from "react";
import { transcribeAudio } from "../services/api";

/**
 * VoiceRecorder.jsx
 * 🎤 Real-time waveform visualizer + mic recording for PolyLingo
 * -------------------------------------------------------------
 * - Uses Web Audio API for mic visualization (no dependencies)
 * - Keeps existing speech transcription logic intact
 * - Clean glass-neon glow matching your theme
 */

const VoiceRecorder = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  // 🔊 Start recording & waveform
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // MediaRecorder for actual audio chunks
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      mediaRecorder.start();
      setIsRecording(true);

      // 🎧 Web Audio setup for visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // 🌀 Start visualizing waveform
      drawVisualizer();

      // 🎙️ Start browser speech recognition
      transcribeAudio()
        .then((transcript) => {
          if (onTranscription && typeof onTranscription === "function") {
            onTranscription(transcript);
          }
        })
        .catch((err) => console.error("Error transcribing:", err))
        .finally(() => {
          stopAll(stream);
        });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecording(false);
    }
  };

  // 🛑 Stop everything cleanly
  const stopAll = (stream) => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      cancelAnimationFrame(animationRef.current);
    } catch (e) {}
    setIsRecording(false);
  };

  const handleStopRecording = () => {
    stopAll();
  };

  const handleClick = () => {
    if (isRecording) handleStopRecording();
    else handleStartRecording();
  };

  // 🎨 Canvas drawing loop for waveform
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const bars = 32;
    const barWidth = (WIDTH / bars) - 2;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < bars; i++) {
        const barHeight = dataArray[i] / 2;
        const x = i * (barWidth + 2);
        const y = HEIGHT - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, HEIGHT);
        gradient.addColorStop(0, "#00bfff");
        gradient.addColorStop(1, "rgba(0, 191, 255, 0.1)");

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00bfff";
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    draw();
  };

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`voice-button ${isRecording ? "listening" : ""}`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        style={{
          boxShadow: isRecording ? "0 0 20px rgba(0,191,255,0.5)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {isRecording ? "🔴 Stop" : "🎤 Speak"}
      </button>

      {/* 🎧 Canvas visualizer */}
      <canvas
        ref={canvasRef}
        width="120"
        height="30"
        style={{
          display: isRecording ? "block" : "none",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 0 10px rgba(0,191,255,0.2)",
          backdropFilter: "blur(6px)",
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
};

export default VoiceRecorder;
