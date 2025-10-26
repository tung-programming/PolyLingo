# backend/app/routes/chat_pipeline.py
"""
PolyLingo Chat Route
--------------------
Connects frontend with the full NLP + Emotion + Persona pipeline.
Endpoint: POST /api/nlp/response
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.nlp.response_generator import generate_reply


# ---------------------- Request Schema ----------------------
class ChatRequest(BaseModel):
    user_input: str
    user_id: str = "guest"
    persona: str = "friendly"


# ---------------------- Router Setup ------------------------
router = APIRouter(prefix="/api/nlp", tags=["Chat Pipeline"])


# ---------------------- Route Logic -------------------------
@router.post("/response")
async def chat_pipeline(request: ChatRequest):
    """
    Accepts:
    {
        "user_input": "Hola amigo!",
        "user_id": "demo_user",
        "persona": "friendly"
    }

    Returns:
    {
        "success": true,
        "reply": "...",
        "language": "...",
        "emotion": {...},
        "mood": {...},
        "tts_hint": {...},
        "persona": "friendly",
        "user_id": "demo_user"
    }
    """
    try:
        # Generate the chatbot response using the full NLP + Emotion pipeline
        result = generate_reply(
            user_input=request.user_input,
            user_id=request.user_id,
            persona=request.persona
        )

        # Return formatted response for the frontend
        return {
            "success": True,
            "reply": result.get("reply"),
            "language": result.get("language"),
            "emotion": result.get("emotion"),
            "mood": result.get("mood"),
            "tts_hint": result.get("tts_hint"),
            "persona": result.get("persona"),
            "user_id": result.get("user_id"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
