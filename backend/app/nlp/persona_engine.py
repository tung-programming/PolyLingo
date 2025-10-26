# backend/app/nlp/persona_engine.py
from typing import Dict

# Localized greetings/phrases
GREETINGS = {
    "en": {"hello": "Hey there", "bye": "See you soon"},
    "hi": {"hello": "नमस्ते", "bye": "फिर मिलेंगे"},
    "es": {"hello": "¡Hola!", "bye": "¡Hasta pronto!"},
    "fr": {"hello": "Salut", "bye": "À bientôt"},
}

# Persona tone templates
PERSONAS = {
    "friendly": {
        "style": "use warm and caring words, sprinkle emojis, and stay supportive.",
        "examples": ["😊", "💖", "Glad to help!"]
    },
    "witty": {
        "style": "add light humor, clever remarks, and casual tone.",
        "examples": ["😏", "😉", "Smart move, huh?"]
    },
    "professional": {
        "style": "stay concise, polite, and formal.",
        "examples": ["👍", "Understood.", "Let me handle that."]
    },
    "caring": {
        "style": "be empathetic and reassuring.",
        "examples": ["🤗", "💙", "I'm here for you."]
    }
}


def apply_persona(text: str, persona: str = "friendly", language: str = "en") -> Dict:
    """
    Returns a modified prompt/response with persona styling and localized greeting.
    """
    persona_data = PERSONAS.get(persona, PERSONAS["friendly"])
    localized = GREETINGS.get(language, GREETINGS["en"])

    # choose greeting based on keywords
    greeting = localized["hello"] if any(word in text.lower() for word in ["hi", "hello", "hola", "नमस्ते"]) else ""

    # compose tone description for prompt or final text
    tone = f"Respond in a {persona} tone. {persona_data['style']}"
    decorated = f"{greeting} {text}".strip()

    return {
        "persona": persona,
        "language": language,
        "modified_text": decorated,
        "tone_instruction": tone,
        "emoji_hint": persona_data["examples"][0]
    }


if __name__ == "__main__":
    samples = [
        ("Hello there!", "friendly", "en"),
        ("Hola amigo!", "witty", "es"),
        ("Bonjour!", "professional", "fr"),
        ("नमस्ते", "caring", "hi")
    ]
    for text, persona, lang in samples:
        print(f"\n{text} | Persona: {persona}, Lang: {lang}")
        result = apply_persona(text, persona, lang)
        print(result)
