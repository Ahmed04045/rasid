"""
gemini_analyzer.py

Real AI analysis engine for Rasid, powered by Gemini 3 Flash (multimodal).

Note: this deliberately uses the standard Gemini 3 Flash model, NOT the
"Live" variant. Gemini Live models are built for persistent, real-time
audio-to-audio conversations (voice agents) - overkill and the wrong
shape for a one-shot "analyze this trigger, return JSON" call. Standard
Gemini 3 Flash supports text + image input and structured JSON output,
which is exactly what this pipeline needs.

Setup:
    pip install google-genai pydantic

    export GEMINI_API_KEY="your-key-here"
    # get a free-tier key at https://aistudio.google.com/apikey

Usage:
    python gemini_analyzer.py
"""

import os
import json
from typing import Optional
from pydantic import BaseModel
from google import genai
from google.genai import types

MODEL_NAME = "gemini-3.6-flash"  # current GA multimodal model, not the Live variant


class ReportAnalysisResult(BaseModel):
    category: str          # ROAD_HAZARD | MEDICAL | FIRE | SECURITY | GENERAL_INQUIRY
    severity_level: str    # LOW | MEDIUM | HIGH | CRITICAL
    target_entity: str     # MUNICIPALITY | TRAFFIC_POLICE | AMBULANCE | FIRE_DEPARTMENT
    summary: str
    action_required: str


# In gemini_analyzer.py

SYSTEM_PROMPT = """You are Rasid's automated camera incident classification engine.
You receive periodic image frames captured from a road camera or vehicle feed.
Analyze the image for hazards, traffic accidents, fires, or emergencies.
Respond with ONLY valid JSON matching exactly this schema:

{
  "category": "ROAD_HAZARD" | "MEDICAL" | "FIRE" | "SECURITY" | "GENERAL_INQUIRY",
  "severity_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "target_entity": "MUNICIPALITY" | "TRAFFIC_POLICE" | "AMBULANCE" | "FIRE_DEPARTMENT",
  "summary": "one sentence summary of what is visible in the frame",
  "action_required": "one sentence recommended action for the target entity"
}

If no incident or hazard is present, classify as GENERAL_INQUIRY, severity LOW, target_entity MUNICIPALITY.
If a collision or accident with possible injuries is shown, always classify severity as HIGH or CRITICAL and target_entity as AMBULANCE.
"""

def analyze_incident(
    text: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    image_mime_type: str = "image/jpeg",
) -> ReportAnalysisResult:
    """
    Sends frame images and optional text to Gemini 3 Flash.
    Returns structured JSON routing analysis.
    """
    client = get_client()
    parts = []
    
    # Fallback text prompt for frame-only analysis
    prompt_text = text if text else "Analyze this video frame captured from live road feed."
    parts.append(types.Part.from_text(text=f"Report: {prompt_text}"))
    
    if image_bytes:
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type=image_mime_type))

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            thinking_config=types.ThinkingConfig(thinking_level="minimal"),
            response_mime_type="application/json",
        ),
    )

    data = json.loads(response.text)
    return ReportAnalysisResult(**data)


if __name__ == "__main__":
    # Quick manual test - simulates a collision report coming in as text.
    sample_text = "Two cars collided at the intersection, one driver appears injured and isn't moving."
    result = analyze_incident(sample_text)
    print(result.model_dump_json(indent=2))