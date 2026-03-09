import os
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent.parent
UPLOAD_DIR  = BASE_DIR / "uploads"
TRANSCRIPT_DIR = BASE_DIR / "transcripts"
DB_PATH     = BASE_DIR / "transcripts.db"

UPLOAD_DIR.mkdir(exist_ok=True)
TRANSCRIPT_DIR.mkdir(exist_ok=True)

# ── Whisper model (loaded once at startup) ────────────────────────────────────
# model sizes: tiny, base, small, medium, large-v2, large-v3
# device="cuda" uses your GPU; compute_type="float16" is fastest on GPU
print("Loading Whisper model...")
model = WhisperModel("medium", device="cpu", compute_type="int8")
print("Model ready.")

# ── Database ──────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transcripts (
            id          TEXT PRIMARY KEY,
            filename    TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            duration_s  REAL,
            text        TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Audio Transcriber")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Save upload
    ext = Path(file.filename).suffix
    tmp_path = UPLOAD_DIR / f"{uuid.uuid4()}{ext}"
    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(await file.read())

    try:
        # Transcribe
        segments, info = model.transcribe(str(tmp_path), beam_size=5)
        full_text = "\n".join(seg.text.strip() for seg in segments)
        duration  = info.duration

        # Save .txt
        transcript_id = str(uuid.uuid4())
        stem = Path(file.filename).stem
        txt_path = TRANSCRIPT_DIR / f"{stem}_{transcript_id[:8]}.txt"
        txt_path.write_text(full_text, encoding="utf-8")

        # Save to DB
        now = datetime.utcnow().isoformat()
        conn = get_db()
        conn.execute(
            "INSERT INTO transcripts (id, filename, created_at, duration_s, text) VALUES (?,?,?,?,?)",
            (transcript_id, file.filename, now, duration, full_text)
        )
        conn.commit()
        conn.close()

        return {
            "id": transcript_id,
            "filename": file.filename,
            "created_at": now,
            "duration_s": duration,
            "text": full_text,
            "txt_file": txt_path.name,
        }
    finally:
        tmp_path.unlink(missing_ok=True)


@app.get("/transcripts")
def list_transcripts(q: str = ""):
    conn = get_db()
    if q:
        rows = conn.execute(
            "SELECT id, filename, created_at, duration_s, text FROM transcripts "
            "WHERE text LIKE ? OR filename LIKE ? ORDER BY created_at DESC",
            (f"%{q}%", f"%{q}%")
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, filename, created_at, duration_s, text FROM transcripts ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.delete("/transcripts/{transcript_id}")
def delete_transcript(transcript_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM transcripts WHERE id=?", (transcript_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    conn.execute("DELETE FROM transcripts WHERE id=?", (transcript_id,))
    conn.commit()
    conn.close()
    return {"deleted": transcript_id}
