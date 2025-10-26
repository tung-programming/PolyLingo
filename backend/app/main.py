from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import nlp_routes, persona_routes, stt_routes, tts_routes

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Default Vite dev server port
    # Add other frontend origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(nlp_routes.router, prefix="/api/nlp")
app.include_router(persona_routes.router, prefix="/api/personas")
app.include_router(stt_routes.router, prefix="/api/stt")
app.include_router(tts_routes.router, prefix="/api/tts")

@app.get("/")
def read_root():
    return {"message": "Welcome to the MultiChat API"}
