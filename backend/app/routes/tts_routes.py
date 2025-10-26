from fastapi import APIRouter, Body
from fastapi.responses import Response
from gtts import gTTS
import io

router = APIRouter()

@router.post("/tts")
async def text_to_speech(text: str = Body(..., embed=True)):
    """
    Accepts text and returns the synthesized speech as an audio file.
    """
    try:
        # Create a bytes buffer
        mp3_fp = io.BytesIO()
        
        # Create gTTS object and save to buffer
        tts = gTTS(text=text, lang='en')
        tts.write_to_fp(mp3_fp)
        
        # Move buffer position to start
        mp3_fp.seek(0)
        
        # Return as a streaming response
        return Response(content=mp3_fp.read(), media_type="audio/mpeg")

    except Exception as e:
        return Response(content=str(e), status_code=500)
