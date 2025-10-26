# backend/app/nlp/response_generator.py
"""
PolyLingo — Multilingual Persona Chatbot
Powered by Groq (LLaMA3-8B-8192)

Handles:
- Language detection
- Emotion analysis
- Persona tone
- Mood/XP tracking
- Multilingual text generation via Groq API
"""

import os
from typing import Dict
from dotenv import load_dotenv
load_dotenv()
# Local imports
from app.nlp.language_detector import detect_language
from app.nlp.persona_engine import apply_persona
from app.nlp.emotion_analyzer import analyze_emotion
from app.nlp.mood_tracker import update_mood_xp

# Groq/OpenAI client
from openai import OpenAI

# --------------------------- MODEL SETUP ---------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError("⚠️  GROQ_API_KEY missing in .env file")

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)
MODEL_NAME = "llama-3.1-8b-instant"

print(f"⚡ Using Groq model: {MODEL_NAME}")


# ----------------------- EMOTION CONFIG -----------------------------
EMOTION_TONE_MAP = {
    "joy": {
        "append": "Keep the tone cheerful and energetic.",
        "tts_hint": {"pitch": "+4%", "rate": "fast"}
    },
    "sadness": {
        "append": "Use gentle, kind, and reassuring words.",
        "tts_hint": {"pitch": "-6%", "rate": "slow"}
    },
    "anger": {
        "append": "Respond calmly and help ease the frustration.",
        "tts_hint": {"pitch": "+1%", "rate": "steady"}
    },
    "fear": {
        "append": "Speak reassuringly and softly.",
        "tts_hint": {"pitch": "-3%", "rate": "slow"}
    },
    "surprise": {
        "append": "Sound curious and lively.",
        "tts_hint": {"pitch": "+3%", "rate": "fast"}
    },
    "neutral": {
        "append": "Keep a friendly, balanced tone.",
        "tts_hint": {"pitch": "0%", "rate": "normal"}
    }
}


# ---------------------- HELPER FUNCTION -----------------------------

def _compose_prompt(modified_input: str, language: str, persona_tone: str, emotion: str) -> str:
    """Creates a structured, emotion-aware prompt for Groq LLaMA3."""
    emotion_instruction = EMOTION_TONE_MAP.get(emotion, EMOTION_TONE_MAP["neutral"])["append"]
    return (
        f"You are PolyLingo, a multilingual, emotionally intelligent chatbot.\n"
        f"Language: {language}\n"
        f"Personality traits: {persona_tone}\n"
        f"Emotional adjustment: {emotion_instruction}\n"
        f"Always respond in the same language as the user, maintaining the emotion and personality.\n"
        f"Limit your response to 3 sentences.\n\n"
        f"User: {modified_input}\n"
        f"Assistant:"
    )


# ----------------------- MAIN FUNCTION ------------------------------

def generate_reply(user_input: str, user_id: str = "guest", persona: str = "friendly") -> Dict:
    """
    Main generation pipeline
    1. Detect language
    2. Analyze emotion
    3. Update XP / mood tracker
    4. Apply persona tone
    5. Generate Groq LLaMA3 multilingual reply
    """
    # 1) Language detection
    lang_result = detect_language(user_input)
    language = lang_result.get("language", "en")

    # 2) Emotion analysis
    emotion_result = analyze_emotion(user_input)
    emotion = emotion_result.get("emotion", "neutral")
    emotion_conf = emotion_result.get("confidence", 0.0)

    # 3) XP & mood tracking
    mood_info = update_mood_xp(user_id, emotion)

    # 4) Persona customization
    persona_data = apply_persona(user_input, persona, language)
    modified_input = persona_data.get("modified_text", user_input)
    tone_instruction = persona_data.get("tone_instruction", "")
    emoji_hint = persona_data.get("emoji_hint", "")

    # Combine persona + emotion tone
    full_tone = f"{tone_instruction} Additionally: {EMOTION_TONE_MAP.get(emotion, EMOTION_TONE_MAP['neutral'])['append']}"

    # 5) Build the prompt
    prompt = _compose_prompt(modified_input, language, full_tone, emotion)

    # ------------------- GROQ GENERATION -------------------
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are PolyLingo, a helpful, emotional multilingual assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150
        )
        reply_text = completion.choices[0].message.content.strip()

    except Exception as e:
        reply_text = f"Sorry, I couldn't generate a response. ({e})"

    # 6) Voice synthesis hints (for TTS)
    tts_hint = EMOTION_TONE_MAP.get(emotion, EMOTION_TONE_MAP["neutral"])["tts_hint"]

    # 7) Return structured result
    return {
        "user_id": user_id,
        "language": language,
        "persona": persona,
        "emotion": {"label": emotion, "confidence": emotion_conf},
        "mood": mood_info,
        "reply": f"{reply_text} {emoji_hint}",
        "tts_hint": tts_hint
    }


# ----------------------- TEST MODE ----------------------------------
if __name__ == "__main__":
    samples = [
        {"user_id": "demo_user", "text": "I am so happy today!", "persona": "friendly"},
        {"user_id": "demo_user", "text": "Estoy muy triste hoy", "persona": "caring"},
        {"user_id": "demo_user", "text": "Bonjour, comment allez-vous ?", "persona": "professional"},
        {"user_id": "demo_user", "text": "मुझे डर लग रहा है", "persona": "caring"},
        {"user_id": "demo_user", "text": "That was awesome!", "persona": "witty"}
    ]

    for s in samples:
        print("\n---")
        print("User:", s["text"])
        result = generate_reply(s["text"], s["user_id"], s["persona"])
        print("Result:", result)
