from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import vosk
import json
import wave
import os

router = APIRouter()

# NOTE: You need to download a Vosk model and place it in the 'backend' directory.
# You can find models here: https://alphacephei.com/vosk/models
VOSK_MODEL_PATH = "vosk-model-small-en-us-0.15" 
if not os.path.exists(VOSK_MODEL_PATH):
    raise FileNotFoundError(f"Vosk model not found at '{VOSK_MODEL_PATH}'. Please download and extract a model from https://alphacephei.com/vosk/models")

model = vosk.Model(VOSK_MODEL_PATH)

@router.post("/stt")
async def speech_to_text(audio_file: UploadFile = File(...)):
    """
    Accepts an audio file and returns the transcribed text.
    """
    try:
        # The audio file needs to be in a format that wave module can handle (e.g., WAV)
        # The frontend should ensure this format.
        with wave.open(audio_file.file, "rb") as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
                return JSONResponse(status_code=400, content={"error": "Audio file must be WAV format with 16-bit mono PCM."})
            
            rec = vosk.KaldiRecognizer(model, wf.getframerate())
            rec.SetWords(True)
            
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    pass
            
            result = json.loads(rec.FinalResult())
            return {"text": result["text"]}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
