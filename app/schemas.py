from pydantic import BaseModel, Field
from typing import List, Literal

class MessageItem(BaseModel):
    """
    Represents an individual message inside a chat history thread.
    Conforms to the OpenRouter/OpenAI message specification.
    """
    role: Literal["user", "assistant", "system"] = Field(
        ..., 
        description="Role of the message author: 'user', 'assistant', or 'system'"
    )
    content: str = Field(
        ..., 
        min_length=1, 
        description="Text content of the message segment"
    )

class ChatRequest(BaseModel):
    """
    Payload schema for initiating chat completions.
    """
    messages: List[MessageItem] = Field(
        ..., 
        description="Chronological thread message sequence representing conversation context"
    )
