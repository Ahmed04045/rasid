# server.py
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict
from gemini_analyzer import analyze_incident, ReportAnalysisResult

app = FastAPI(
    title="Rasid Live Camera Stream Processing API",
    version="1.0.0"
)

# Enable CORS for local development with frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store holding the latest AI status per stream ID
latest_stream_states: Dict[str, dict] = {}

@app.post("/api/v1/stream-frame")
async def process_stream_frame(
    stream_id: str = Form("camera_01"),
    frame: UploadFile = File(...)
):
    """
    Receives frame snapshot every 5s from Frontend and passes to Gemini.
    """
    try:
        image_bytes = await frame.read()
        mime_type = frame.content_type or "image/jpeg"
        
        # Analyze frame with Gemini engine
        result: ReportAnalysisResult = analyze_incident(
            text=f"Live camera stream snapshot from {stream_id}",
            image_bytes=image_bytes,
            image_mime_type=mime_type
        )
        
        # Store result for dashboard retrieval
        latest_stream_states[stream_id] = {
            "stream_id": stream_id,
            "analysis": result.model_dump(),
        }
        
        return {
            "status": "success",
            "stream_id": stream_id,
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/stream-status/{stream_id}")
def get_stream_status(stream_id: str):
    """
    Allows Frontend dashboard to fetch the latest analysis result.
    """
    if stream_id not in latest_stream_states:
        return {"status": "waiting", "message": "No frames processed yet."}
    return latest_stream_states[stream_id]