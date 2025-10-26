import axios from "axios";

// 🌐 Backend API base URL
const API_BASE = "http://127.0.0.1:8000/api/nlp";

/* ============================================================================
   🧠 1. Send message to backend
   ========================================================================== */
export async function sendMessageToBot(user_input, user_id = "guest", persona = "friendly") {
  try {
    const response = await axios.post(`${API_BASE}/response`, {
      user_input,
      user_id,
      persona,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
}

/* ============================================================================
   🔊 2. Convert text to speech (TTS)
   Uses browser’s SpeechSynthesis API for multilingual support.
   Returns the utterance object so callers can observe events.
   ========================================================================== */
export async function synthesizeSpeech(text, language = "en") {
  if (!text) return;

  // 🌍 Language mapping
  const langMap = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    hi: "hi-IN",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
    ar: "ar-SA",
    ru: "ru-RU",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-BR",
    tr: "tr-TR",
    fi: "fi-FI",
    el: "el-GR",
  };
  const targetLang = langMap[language] || "en-US";

  // 🕒 Wait for voices to load
  const loadVoices = () =>
    new Promise((resolve) => {
      let voices = speechSynthesis.getVoices();
      if (voices.length) return resolve(voices);
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      };
    });

  const voices = await loadVoices();

  // 🎯 Prefer Google voices for target language
  let matchedVoice =
    voices.find(
      (v) =>
        v.name.includes("Google") &&
        (v.lang.toLowerCase().startsWith(targetLang.toLowerCase()) ||
          v.lang.toLowerCase().startsWith(language.toLowerCase()))
    ) ||
    // fallback: any voice matching target language
    voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase())) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(language.toLowerCase())) ||
    // fallback: Google US English
    voices.find((v) => v.name.includes("Google US English")) ||
    voices[0];

  console.log(
    `%c🎤 Speaking "${text}" in ${targetLang} using: ${matchedVoice?.name || "Default Voice"}`,
    "color:#00ffff;font-weight:bold;"
  );

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = matchedVoice;
  utterance.lang = matchedVoice.lang;
  utterance.pitch = 1;
  utterance.rate = 1;

  // Stop any current speech and start new
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}



/* ============================================================================
   🎤 3. Transcribe audio (Speech-to-Text)
   Uses browser’s built-in Web Speech API for instant transcription.
   Returns a promise that resolves with the transcript string.
   ========================================================================== */
export async function transcribeAudio() {
  return new Promise((resolve, reject) => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error("SpeechRecognition not supported in this browser."));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US"; // can be dynamic
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        console.error("🎙️ Voice recognition error:", event.error);
        reject(event.error);
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
}

/* ============================================================================
   🎭 0. Get available personas for the selector
   ========================================================================== */
export async function getPersonas() {
  return [
    { id: "friendly", label: "Friendly 🤗" },
    { id: "witty", label: "Witty 😏" },
    { id: "caring", label: "Caring 💖" },
    { id: "professional", label: "Professional 💼" },
    { id: "neutral", label: "Neutral 🧘‍♂️" },
  ];
}

/* Backwards compatible alias */
export const processNlp = sendMessageToBot;
