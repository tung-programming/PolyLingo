# PolyLingo – Multilingual AI Voice Chatbot

PolyLingo is an advanced multilingual AI voice chatbot designed to understand, respond, and speak to users in multiple languages while maintaining emotional awareness and distinct personality tones. The system combines Natural Language Processing (NLP), Speech Recognition (STT), Text-to-Speech (TTS), and Emotion AI into one seamless interactive assistant experience. It serves as an intelligent communication interface capable of analyzing language, detecting sentiment, adapting personality, and providing voice feedback dynamically based on the user’s input.

## Overview

PolyLingo acts as a real-time voice assistant that can listen to user speech, transcribe it into text, process it through language and emotion analysis, generate an intelligent context-based response, and finally speak it out loud in the same detected language. It supports multiple languages and personas, each persona defining a distinct conversational tone. For instance, a “friendly” persona replies warmly and casually, while a “professional” one responds formally and politely. It’s a full-stack application consisting of a FastAPI-based backend and a React-based frontend, integrated with Groq’s LLaMA model for fast and efficient NLP responses.

## Key Features

**Multilingual voice and text-based interaction.**

**Automatic language detection using langdetect and fasttext.**

**Emotion-aware response generation using HuggingFace emotion classification models**

**Persona-based tone control (Friendly, Caring, Witty, Professional)**

**Text-to-Speech synthesis in the same detected language using Web Speech API.**

**Voice input through Speech-to-Text conversion for natural user interaction.**

**Real-time mood tracking and XP system for user engagement.**

**Elegant, glassmorphic UI designed for a modern chatbot experience.**

**Modular architecture allowing separate testing of NLP, persona, emotion, and UI modules.**

## Tech Stack

| Layer                  | Technology                    | Description                                               |
| ---------------------- | ----------------------------- | --------------------------------------------------------- |
| **Frontend**           | React + Vite                  | Interactive chat UI, microphone and speaker integration   |
| **Backend**            | FastAPI (Python)              | Handles API routes, NLP pipeline, and response generation |
| **AI Model**           | Groq (LLaMA 3.1 – 8B Instant) | Generates intelligent, context-aware replies              |
| **Emotion Analysis**   | HuggingFace Transformers      | Classifies emotion from text                              |
| **Language Detection** | langdetect + fasttext         | Automatically detects language                            |
| **Speech**             | Web Speech API                | STT + TTS integration in browsers                         |
| **Styling**            | CSS (Glassmorphism)           | Smooth, minimal dark theme design                         |
| **Environment**        | Python 3.11, Node.js 18+      | Runs locally or deploys on cloud easily                   |


## Architecture

### The system follows a modular pipeline:

1. User Input: The user can either speak through a microphone or type a message.


2. STT Module: Speech-to-Text conversion using the Web Speech API.


3. NLP Pipeline: The backend receives the message and performs:
    - Language detection
    - Emotion classification
    - Persona tone mapping
    - Response generation via Groq model


4. TTS Module: The backend’s text output is sent back to the frontend, which plays it out loud using Text-to-Speech in the detected language.


5. UI Display: The dashboard shows both the user and bot messages, emotion, persona, and XP updates.

This architecture ensures fluid multilingual interaction while keeping emotion and tone consistent throughout the conversation.

## Backend Modules and Testing

### The testing modules resides in the /backend/app/nlp directory and includes several NLP and emotion modules that were tested independently before integration.

1. Language Detection

The language_detector.py file automatically detects the language of the user’s input text. It uses langdetect and fasttext to identify over 20 languages, enabling multilingual response generation.

2. Emotion Analysis

The emotion_analyzer.py file uses a HuggingFace transformer model (j-hartmann/emotion-english-distilroberta-base) to determine the user’s emotion, such as joy, sadness, anger, fear, or neutral.

3. Persona Engine

The persona_engine.py file adjusts the chatbot’s tone and response structure based on the selected persona. It defines how each personality communicates, adds appropriate emojis, and modulates style.
- Example personas include:
   - Friendly: Cheerful and emoji-filled responses.
   - Professional: Concise, polite, and formal tone.
   - Caring: Empathetic, reassuring, and understanding replies.
   - Witty: Playful, clever, and humorous tone.

4. Mood Tracker

The mood_tracker.py file tracks the user’s XP and dominant emotional state. Each interaction grants XP, and once it crosses a certain threshold, the user “levels up,” simulating progress and engagement.

5. Response Generation

The response_generator.py file connects to the Groq API using the llama-3.1-8b-instant model. It takes the detected language, emotion, and persona as input and generates contextually relevant, emotionally aligned replies.

---
**You can test this locally by running:**
```
python -m app.nlp.response_generator
```
**Sample output:**
```
{
  "user_input": "I am happy today",
  "language": "en",
  "persona": "friendly",
  "emotion": "joy",
  "reply": "That's amazing! I'm really glad you're feeling happy today 😊",
  "tts_hint": {"pitch": "+4%", "rate": "fast"}
}
```

## FastAPI Backend Integration

The backend routes are managed through FastAPI under /app/routes/chat_pipeline.py.

Primary Endpoint:
```
POST /api/nlp/response
```
Request Example:
```
{
  "user_input": "Bonjour, comment allez-vous?",
  "user_id": "guest",
  "persona": "friendly"
}
```
Response Sample:
```
{
  "user_input": "Bonjour, comment allez-vous?",
  "user_id": "guest",
  "persona": "friendly"
}
```
Response Example:
```
{
  "success": true,
  "language": "fr",
  "emotion": {"label": "neutral", "confidence": 0.91},
  "persona": "friendly",
  "reply": "Bonjour! 😊 Je vais très bien, merci. Comment allez-vous?",
  "tts_hint": {"pitch": "+2%", "rate": "normal"}
}
```
This endpoint powers the entire chatbot flow, linking frontend user queries to NLP-generated responses.
---
## You can start the backend with:
```
uvicorn main:app --reload
```
**Desclaimer: Before running the above scripts , make sure you have activated the virtual environment and all the dependencies have been installed when it is activate. It should look similar to the one I have shown below depending on the name of your environment**

```
(venv) PS D:\Ai-verse\multichat\backend> uvicorn main:app --reload
```
---
## Frontend Design
    
The frontend interface, located in /frontend/polylingo-ui/, handles all user interaction, visual display, and voice features.

**Main Components:**
  - Dashboard.jsx → Chat display and input logic.
  - PersonaSelector.jsx → Dropdown for choosing persona type.
  - VoiceRecorder.jsx → Microphone input using browser SpeechRecognition API.
  - ResponsePlayer.jsx → Text-to-Speech playback for bot replies.
  - api.js → Connects frontend to FastAPI endpoints.
  - App.css → Complete UI design with smooth glassmorphism, shadows, and dark theme.

**Speech Handling:**
  - Speech-to-Text: Captures user voice and converts it to text dynamically.
  - Text-to-Speech: Speaks the bot’s response in the detected language, automatically switching voice engines for correct pronunciation (e.g., Japanese → Google 日本語 voice).

**Command:**
```
npm run dev
```

Frontend runs on http://localhost:5173.

## Multilingual Support
**PolyLingo supports a wide range of languages both in text and speech, including:**
  - english
  - Hindi
  - Japanese
  - French
  - Spanish
  - Portuguese
  - Chinese (Simplified & Traditional)
  - Korean
  - Russian
  - Italian
It automatically detects input language and switches to an appropriate TTS voice (e.g., Japanese → ja-JP, Hindi → hi-IN).

## Endpoints Summary
| Endpoint              | Method | Purpose                                               |
| --------------------- | ------ | ----------------------------------------------------- |
| `/api/nlp/response`   | POST   | Generates a language and emotion-aware chatbot reply. |
| `/api/stt/transcribe` | POST   | Converts user speech to text (browser handled).       |
| `/api/tts/speak`      | POST   | Converts text to speech (browser handled).            |
| `/api/persona/list`   | GET    | Retrieves all available persona options.              |

## Execution Flow

1. The user types or speaks to the bot.

2. The system detects language and emotion.

3. Persona tone and style are applied.

4. The Groq NLP model generates the reply.

5. The message appears on-screen and is spoken out loud in the correct language.

6. The XP tracker updates based on user emotion and interaction frequency.

## Future Enhancements

- Add long-term memory for context continuity.

- Integrate user-specific profiles and mood history.

- Deploy to cloud (AWS/GCP) with HTTPS endpoints.

- Add emotion-driven voice modulation for realism.

- Optionally connect to 3D avatar for visual expressions.


## Conclusion

PolyLingo is a fully functional multilingual AI chatbot that merges NLP, speech recognition, text-to-speech, and emotion analysis into a single unified interface. It understands language context, emotional state, and personality tones to deliver intelligent, human-like responses. With real-time voice interaction and a beautifully designed UI, PolyLingo stands as an advanced demonstration of multilingual and emotion-aware AI communication. It showcases how technology can bridge linguistic and emotional gaps, creating conversations that feel truly alive.
## Team Credits and Roles

| Role                                        | Member           | Responsibilities                                                                                                                                                             |
| ------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  **ML / Emotion Specialist**              | **[Tushar P](https://github.com/tung-programming)**     | Designed and implemented the emotion detection module, integrated Groq NLP model, managed language and sentiment mapping, and ensured multilingual voice synthesis accuracy. |
|  **Backend Lead (STT & TTS Integration)** | **[Rakshak S](https://github.com/PRATHVI9607),Chinmai** | Developed FastAPI server, created API endpoints for NLP, speech recognition, and text-to-speech conversion, integrated model responses.                                      |
|  **NLP & Persona Engineer**              | **[Tushar P](https://github.com/tung-programming)** | Handled language detection and persona logic, integrated GPT-style prompt structure, and developed response personalization module.                                          |
|  **Frontend Developer (UI/UX)**           | **[Chiranthan](https://github.com/chiranthan-01), [Rahul](https://github.com/Hollow-17R)** | Built and styled the React dashboard, managed voice controls, and linked frontend components to backend APIs.                                                                |
|  **Security & Documentation Lead**        | **[Tushar P](https://github.com/tung-programming)/Chinmai** | Wrote documentation, ensured data safety for speech input, and prepared presentation material and architecture diagrams.                                                     |

