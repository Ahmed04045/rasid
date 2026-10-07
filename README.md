# Rasid

Rasid is a camera and citizen-report incident analysis demo. Its web app sends
camera frames and text-only SOS reports to a FastAPI backend, which uses the
Gemini API to classify incidents and recommend an action.

## Project layout

- `rasid-app/backend/` — FastAPI service used by the web app.
- `rasid-app/frontend/` — Next.js dashboard.
- `rasid-app/frontend-prototype/` — separate earlier frontend prototype, kept
  for reference; the active app is `rasid-app/frontend/`.
- `server.py` and `gemini_analyzer.py` — standalone backend prototype at the
  workspace root.
- `mock_trigger.py` — command-line simulator for sample vehicle sensor events.

## Requirements

- Python 3.10 or newer
- Node.js and npm
- A Gemini API key, available from [Google AI Studio](https://aistudio.google.com/apikey)

## Run the backend

In PowerShell, from the project root:

```powershell
cd rasid-app/backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy the backend environment template and add your key:

```powershell
Copy-Item .env.example .env
```

Edit `rasid-app/backend/.env` and replace the placeholder with your Gemini API
key. Then start the API:

```powershell
uvicorn server:app --reload
```

The API is available at `http://localhost:8000`; its interactive documentation
is at `http://localhost:8000/docs`.

## Run the frontend

Open another PowerShell terminal from the project root:

```powershell
cd rasid-app/frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The frontend uses `http://localhost:8000` by
default. To configure it explicitly, copy the template to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Run that command from `rasid-app/frontend`. Edit `.env.local` if your backend
uses a different URL.

## API routes

- `GET /` — backend health check.
- `POST /api/v1/stream-frame` — submit a camera frame for analysis.
- `GET /api/v1/stream-status/{stream_id}` — get the latest analysis for a
  stream.
- `POST /api/v1/sos` — submit a text-only SOS report.

The latest stream results are stored in memory and are cleared when the backend
restarts. This demo is not configured for production deployment.

## Simulate a sensor trigger

From the project root, run:

```powershell
py mock_trigger.py
```

This prints a sample incident report and does not call the Gemini API.
