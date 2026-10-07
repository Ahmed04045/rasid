# server.py
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from gemini_analyzer import analyze_incident, ReportAnalysisResult

app = FastAPI(
    title="Rasid AI Backend",
    version="1.0.0"
)

# Enable CORS for local development and Vercel frontend.
# allow_credentials is False because we don't use cookies/auth here -
# browsers reject the allow_origins=["*"] + allow_credentials=True combo anyway.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store holding the latest AI status per stream ID.
# NOTE: this resets on every server restart/redeploy - fine for a hackathon
# demo, not durable enough for production.
latest_stream_states: Dict[str, dict] = {}


class SosRequest(BaseModel):
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@app.get("/")
def health_check():
    return {"status": "online", "system": "Rasid AI Engine"}


@app.post("/api/v1/stream-frame")
async def process_stream_frame(
    stream_id: str = Form("camera_01"),
    frame: UploadFile = File(...)
):
    """
    Receives a camera frame - either the vehicle mode's recurring 5s
    snapshot, or a citizen's single "Snap & Analyze" photo - and passes
    it to Gemini for analysis.
    """
    try:
        image_bytes = await frame.read()
        mime_type = frame.content_type or "image/jpeg"

        result: ReportAnalysisResult = analyze_incident(
            text=f"Camera snapshot from {stream_id}",
            image_bytes=image_bytes,
            image_mime_type=mime_type,
        )

        latest_stream_states[stream_id] = {
            "stream_id": stream_id,
            "analysis": result.model_dump(),
        }

        return {
            "status": "success",
            "stream_id": stream_id,
            "result": result,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/stream-status/{stream_id}")
def get_stream_status(stream_id: str):
    """
    Allows the frontend dashboard to fetch the latest analysis result
    for a given stream (polling fallback, not required by the current UI).
    """
    if stream_id not in latest_stream_states:
        return {"status": "waiting", "message": "No frames processed yet."}
    return latest_stream_states[stream_id]


@app.post("/api/v1/sos")
async def submit_sos(payload: SosRequest):
    """
    Text-only emergency report from the Citizen SOS modal - no image
    involved, just a short description and optional coordinates.
    """
    try:
        result: ReportAnalysisResult = analyze_incident(text=payload.description)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))