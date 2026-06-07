import os
import json
import httpx
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.schemas import ChatRequest

# Configure backend logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EditorialAIPort")

app = FastAPI(
    title="Editorial AI Assistant Server",
    version="1.0.0",
    description="Secure server-side proxy for streaming OpenRouter completions."
)

# Apply Cross-Origin Resource Sharing rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/config")
async def get_config():
    """
    Exposes server configurations to the frontend.
    Alerts client if local environment key is missing so it can fall back to browser-direct mode.
    """
    return {
        "model": settings.OPENROUTER_MODEL,
        "has_api_key": bool(settings.OPENROUTER_API_KEY)
    }

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Secure server-side chat completions endpoint.
    Streams Server-Sent Events (SSE) from OpenRouter to the client.
    """
    if not settings.OPENROUTER_API_KEY:
        logger.warning("Attempted api/chat access while OPENROUTER_API_KEY is unconfigured.")
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API key is not configured on the backend server. Configure .env with OPENROUTER_API_KEY."
        )

    async def event_generator():
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "X-Title": "Jason Gunawan Portfolio AI Backend Proxy",
            "HTTP-Referer": "http://localhost:8000"
        }
        
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [msg.model_dump() for msg in request.messages],
            "stream": True
        }

        # Safe streaming connection manager
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                logger.info(f"Initiating OpenRouter stream for model: {settings.OPENROUTER_MODEL}")
                async with client.stream(
                    "POST",
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    
                    if response.status_code != 200:
                        error_body = await response.aread()
                        logger.error(f"Upstream OpenRouter error response status {response.status_code}: {error_body.decode()}")
                        yield f"data: {json.dumps({'error': {'message': f'Upstream Completion Error: {response.status_code}', 'details': error_body.decode()}})}\n\n"
                        return

                    async for chunk in response.aiter_bytes():
                        if chunk:
                            yield chunk
                            
            except Exception as e:
                logger.error(f"Streaming completion proxy connection failure: {str(e)}")
                yield f"data: {json.dumps({'error': {'message': f'Server connection failure: {str(e)}'}})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Mount static asset folders for serving the portfolio client on root port (/)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logger.info(f"Serving static folder paths from: {ROOT_DIR}")

# Mount static files (HTML, CSS, JS) at the root level
app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="static")
