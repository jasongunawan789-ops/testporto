from pydantic import BaseModel, Field

class MessageItem(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user' or 'assistant'")
    content: str = Field(..., description="Text content of the message")

class ChatRequest(BaseModel):
    messages: list[MessageItem] = Field(..., description="Full chat conversation history")
