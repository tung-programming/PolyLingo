from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import chat_pipeline  # ✅ import our new route

app = FastAPI(title="PolyLingo Backend")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include chat route
app.include_router(chat_pipeline.router)
