from pydantic import BaseModel
from typing import Optional

class NLPRequest(BaseModel):
    text: str
    persona: Optional[str] = None
    user_id: Optional[str] = None
