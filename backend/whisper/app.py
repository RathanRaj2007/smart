import os
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("whisper-service")

app = FastAPI(title="Local Whisper Speech-to-Text Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model ONCE at startup (CPU mode with int8 quantization)
MODEL_NAME = os.getenv("WHISPER_MODEL", "tiny.en")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

logger.info(f"Loading local Whisper model '{MODEL_NAME}' on CPU ({COMPUTE_TYPE})...")
try:
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type=COMPUTE_TYPE)
    logger.info("Local Whisper model successfully loaded and ready.")
except Exception as e:
    logger.warning(f"Failed to load with compute_type='{COMPUTE_TYPE}', trying 'default': {e}")
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type="default")
    logger.info("Local Whisper model loaded with default compute type.")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": "cpu",
    }


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded")

    # Save to a temporary file for faster-whisper CTranslate2 reader
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".webm"
    if not suffix:
        suffix = ".webm"

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        temp_file.write(content)
        temp_file.close()

        logger.info(f"Transcribing audio file ({len(content)} bytes)...")

        # Run local Whisper transcription (English only)
        segments, info = model.transcribe(
            temp_file.name,
            language="en",
            beam_size=1,
            vad_filter=True,
        )

        transcript_text = " ".join([segment.text.strip() for segment in segments]).strip()
        logger.info(f"Transcription complete ({info.duration:.2f}s audio): '{transcript_text}'")

        return {
            "text": transcript_text,
            "duration": round(info.duration, 2),
            "language": info.language,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Guarantee temporary file is deleted after processing
        if os.path.exists(temp_file.name):
            try:
                os.remove(temp_file.name)
            except Exception as cleanup_err:
                logger.warning(f"Failed to delete temp file {temp_file.name}: {cleanup_err}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)
