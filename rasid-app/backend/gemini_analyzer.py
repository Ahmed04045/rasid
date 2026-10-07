"""
gemini_analyzer.py

Real AI analysis engine for Rasid, powered by Gemini 3.6 Flash (multimodal).

Note: this deliberately uses the standard Gemini Flash model, NOT the
"Live" variant. Gemini Live models are built for persistent, real-time
audio-to-audio conversations (voice agents) - overkill and the wrong
shape for a one-shot "analyze this input, return JSON" call. Standard
Gemini Flash supports text + image input and structured JSON output,
which is exactly what this pipeline needs.

Setup:
    pip install google-genai pydantic python-dotenv

    Create a .env file next to this script:
        GEMINI_API_KEY=your-key-here
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

try:
    from dotenv import load_dotenv
    load_dotenv()  # loads GEMINI_API_KEY from a local .env file if present
except ImportError:
    pass  # dotenv is optional - env var can still be set manually

MODEL_NAME = "gemini-3.6-flash"  # current GA multimodal model, not the Live variant


class ReportAnalysisResult(BaseModel):
    category: str          # ROAD_HAZARD | MEDICAL | FIRE | SECURITY | GENERAL_INQUIRY
    severity_level: str    # LOW | MEDIUM | HIGH | CRITICAL
    target_entity: str     # MUNICIPALITY | TRAFFIC_POLICE | AMBULANCE | FIRE_DEPARTMENT
    summary: str
    action_required: str


SYSTEM_PROMPT = """You are Rasid's incident classification engine.
You may receive one of two kinds of input:
  (a) a road or vehicle camera frame with a short caption, or
  (b) a text-only citizen report or SOS description with no image.

Analyze whatever is provided for hazards, traffic accidents, fires, medical
emergencies, or security threats. Respond with ONLY valid JSON, no markdown
formatting, matching exactly this schema:

{
  "category": "ROAD_HAZARD" | "MEDICAL" | "FIRE" | "SECURITY" | "GENERAL_INQUIRY",
  "severity_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "target_entity": "MUNICIPALITY" | "TRAFFIC_POLICE" | "AMBULANCE" | "FIRE_DEPARTMENT",
  "summary": "one sentence summary of the incident",
  "action_required": "one sentence recommended action for the target entity"
}

If no incident or hazard is present in an image, classify as GENERAL_INQUIRY,
severity LOW, target_entity MUNICIPALITY.
If a collision, fire, or life-threatening emergency is described or shown,
always classify severity as HIGH or CRITICAL and route to the matching
emergency service (AMBULANCE for medical, FIRE_DEPARTMENT for fire,
TRAFFIC_POLICE for security/other threats).
"""


def get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to a .env file next to this "
            "script, or set it as an environment variable."
        )
    return genai.Client(api_key=api_key)


def analyze_incident(
    text: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    image_mime_type: str = "image/jpeg",
) -> ReportAnalysisResult:
    """
    Sends report text and/or an image to Gemini 3.6 Flash and returns a
    validated, structured ReportAnalysisResult.
    """
    client = get_client()
    parts = []

    prompt_text = text if text else "Analyze this image for road hazards or emergencies."
    parts.append(types.Part.from_text(text=f"Report: {prompt_text}"))

    if image_bytes:
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type=image_mime_type))

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            # Gemini 3.x: temperature/top_p/top_k are no longer recommended -
            # use thinking_level instead. "minimal" is fastest/cheapest and
            # is the right choice for a routing/classification task like this.
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