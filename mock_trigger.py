"""
mock_trigger.py

Local simulator for the vehicle/sensor input channel.
No API calls, no key required - use this to develop and test the
frontend/dashboard integration before the real AI backend is wired up.

Simulates: a car's onboard camera/sensor detects something on the road,
fires a "trigger", and this module returns a structured report exactly
matching the schema the real Gemini-powered analyzer will return.

Run directly to see a sample trigger -> report cycle:
    python mock_trigger.py
"""

import random
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone


@dataclass
class ReportAnalysisResult:
    category: str          # ROAD_HAZARD | MEDICAL | FIRE | SECURITY | GENERAL_INQUIRY
    severity_level: str    # LOW | MEDIUM | HIGH | CRITICAL
    target_entity: str     # MUNICIPALITY | TRAFFIC_POLICE | AMBULANCE | FIRE_DEPARTMENT
    summary: str
    action_required: str
    latitude: float
    longitude: float
    timestamp: str
    source: str = "VEHICLE_SENSOR"


# A few canned scenarios so repeated triggers don't all look identical
SCENARIOS = [
    dict(
        category="MEDICAL",
        severity_level="CRITICAL",
        target_entity="AMBULANCE",
        summary="Vehicle collision detected via onboard camera; visible impact damage.",
        action_required="Dispatch nearest ambulance and traffic unit immediately.",
    ),
    dict(
        category="ROAD_HAZARD",
        severity_level="MEDIUM",
        target_entity="MUNICIPALITY",
        summary="Large pothole detected ahead of vehicle position.",
        action_required="Schedule road maintenance inspection.",
    ),
    dict(
        category="FIRE",
        severity_level="CRITICAL",
        target_entity="FIRE_DEPARTMENT",
        summary="Smoke detected from a vehicle on the roadside.",
        action_required="Dispatch fire unit immediately.",
    ),
]


def fake_gps() -> tuple[float, float]:
    """Random coordinates roughly around a city center for demo purposes."""
    base_lat, base_lng = 25.2854, 51.5310  # Doha as a placeholder center
    return (
        round(base_lat + random.uniform(-0.05, 0.05), 6),
        round(base_lng + random.uniform(-0.05, 0.05), 6),
    )


def on_trigger(force_scenario: int | None = None) -> ReportAnalysisResult:
    """
    Call this whenever the "sensor" fires.
    force_scenario: pass an index into SCENARIOS to force a specific
    outcome (handy for a scripted demo instead of relying on random).
    """
    scenario = SCENARIOS[force_scenario] if force_scenario is not None else random.choice(SCENARIOS)
    lat, lng = fake_gps()

    return ReportAnalysisResult(
        **scenario,
        latitude=lat,
        longitude=lng,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


if __name__ == "__main__":
    print("Simulating a sensor trigger...\n")
    time.sleep(0.5)  # pretend there's some processing latency
    report = on_trigger()
    for key, value in asdict(report).items():
        print(f"  {key:16s}: {value}")