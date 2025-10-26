from fastapi import APIRouter
from app.nlp.persona_engine import get_all_personas

router = APIRouter()

@router.get("/personas")
def available_personas():
    return {"personas": get_all_personas()}
