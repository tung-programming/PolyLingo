from fastapi import APIRouter, Body
from app.nlp.language_detector import detect_language
from app.nlp.emotion_analyzer import analyze_emotion
from app.nlp.response_generator import generate_response
from app.nlp.mood_tracker import update_mood_xp
from app.models.request_models import NLPRequest

router = APIRouter()

@router.post("/language-detection")
def language_detection(request: NLPRequest):
    return detect_language(request.text)

@router.post("/emotion")
def emotion_analysis(request: NLPRequest):
    return analyze_emotion(request.text)

@router.post("/response")
def get_response(request: NLPRequest):
    emotion_result = analyze_emotion(request.text)
    emotion = emotion_result.get("emotion", "neutral")
    response = generate_response(request.persona, emotion, request.text)
    
    if request.user_id:
        mood_update = update_mood_xp(request.user_id, emotion)
        return {"response": response, "emotion": emotion_result, "mood_update": mood_update}
    
    return {"response": response, "emotion": emotion_result}
