from transformers import pipeline

# Load Hugging Face sentiment model (multilingual)
emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=True)

def analyze_emotion(text):
    """
    Analyze emotion and return dominant emotion + confidence score.
    """
    try:
        results = emotion_pipeline(text)
        if isinstance(results, list) and len(results) > 0:
            sorted_emotions = sorted(results[0], key=lambda x: x['score'], reverse=True)
            top_emotion = sorted_emotions[0]
            return {
                "emotion": top_emotion['label'],
                "confidence": round(top_emotion['score'], 2),
                "all_emotions": {e['label']: round(e['score'], 2) for e in sorted_emotions}
            }
        else:
            return {"emotion": "neutral", "confidence": 0.5, "all_emotions": {}}
    except Exception as e:
        return {"emotion": "error", "confidence": 0, "message": str(e)}
