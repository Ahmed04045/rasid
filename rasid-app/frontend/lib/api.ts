// lib/api.ts
// Thin client for the Rasid FastAPI backend. Set NEXT_PUBLIC_API_URL in
// your environment (.env.local for dev, Vercel project settings for prod)
// to point at wherever the backend is actually running.

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export type Category = 'ROAD_HAZARD' | 'MEDICAL' | 'FIRE' | 'SECURITY' | 'GENERAL_INQUIRY'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TargetEntity = 'MUNICIPALITY' | 'TRAFFIC_POLICE' | 'AMBULANCE' | 'FIRE_DEPARTMENT'

export type AnalysisResult = {
  category: Category
  severity_level: Severity
  target_entity: TargetEntity
  summary: string
  action_required: string
}

async function unwrap(res: Response): Promise<{ result: AnalysisResult }> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Rasid API error ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

/** Sends a captured camera frame (JPEG Blob) to the backend for AI analysis. */
export async function analyzeFrame(blob: Blob, streamId: string): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('stream_id', streamId)
  form.append('frame', blob, 'frame.jpg')

  const res = await fetch(`${API_BASE_URL}/api/v1/stream-frame`, {
    method: 'POST',
    // Bypasses ngrok's free-tier browser-warning interstitial, which
    // otherwise intercepts the request and returns an HTML page with no
    // CORS headers - that's what causes the "blocked by CORS policy" error.
    headers: { 'ngrok-skip-browser-warning': 'true' },
    body: form,
  })
  const data = await unwrap(res)
  return data.result
}

/** Sends a text-only SOS report (no image) to the backend. */
export async function sendSosReport(
  description: string,
  coords?: { latitude: number; longitude: number },
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({
      description,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    }),
  })
  const data = await unwrap(res)
  return data.result
}