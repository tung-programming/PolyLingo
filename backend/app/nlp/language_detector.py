# backend/app/nlp/language_detector.py
from langdetect import detect_langs, DetectorFactory
import langid

DetectorFactory.seed = 0  # deterministic output


def detect_language(text: str):
    """
    Detects language of input text using langdetect and langid as backup.
    Returns {'language': code, 'confidence': float}.
    """
    if not text or not text.strip():
        return {"language": "unknown", "confidence": 0.0}

    # Try langdetect first
    try:
        langs = detect_langs(text)
        if langs:
            top = langs[0]
            if top.prob > 0.5:
                return {"language": top.lang, "confidence": round(top.prob, 2)}
    except Exception:
        pass

    # Fallback to langid (handles very short text)
    try:
        code, conf = langid.classify(text)
        return {"language": code, "confidence": round(conf, 2)}
    except Exception:
        return {"language": "unknown", "confidence": 0.0}


if __name__ == "__main__":
    samples = [
        "Hello, how are you?",
        "Hola amigo, ¿cómo estás?",
        "मैं ठीक हूँ, धन्यवाद",
        "Bro kal milte hain",
        "Je suis content"
    ]
    for s in samples:
        print(f"\nText: {s}")
        print(detect_language(s))
