import os
import httpx
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.schemas import ChatRequest

app = FastAPI(
    title="Jason Gunawan Portfolio AI Backend",
    version="1.0.0",
    description="Secure server-side proxy for streaming OpenRouter API completions."
)

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/config")
async def get_config():
    """Retrieve public server configuration (model identifier)."""
    return {
        "model": settings.OPENROUTER_MODEL,
        "has_api_key": bool(settings.OPENROUTER_API_KEY)
    }

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Proxy a chat completions request directly to OpenRouter securely on the server-side,
    yielding SSE chunks in real-time.
    """
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API Key not configured on the backend server. Create a .env file containing OPENROUTER_API_KEY."
        )

    async def event_generator():
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "X-Title": "Jason Gunawan Portfolio AI Backend"
        }
        
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [m.model_dump() for m in request.messages],
            "stream": True
        }

        # Use httpx.AsyncClient to perform async chunked stream forwarding
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream(
                    "POST",
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"data: {json.dumps({'error': {'message': f'Upstream Error: {response.status_code}', 'details': error_text.decode()}})}\n\n"
                        return

                    async for chunk in response.aiter_bytes():
                        if chunk:
                            yield chunk
            except Exception as e:
                yield f"data: {json.dumps({'error': {'message': f'Internal Server Error: {str(e)}'}})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Mount Static Portfolio Assets at root (/)
# This serves index.html, chat.html, styles, and js directly on the same server port.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="static")
