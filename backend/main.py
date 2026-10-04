"""
MelodyMind FastAPI Application Entry Point
Exposes REST endpoints for the 5-step AI music pipeline:
1. Data collection & upload
2. Music21 note preprocessing
3. Model definition and parameter tuning
4. Background training & real-time telemetry
5. Sampling, generation, and audio export
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from .config import (
    CLASSICAL_DIR,
    JAZZ_DIR,
    MIDI_DIR,
    OUTPUTS_DIR,
    DEFAULT_LSTM_LAYERS,
    DEFAULT_LSTM_UNITS,
    DEFAULT_DROPOUT,
    DEFAULT_DENSE_UNITS,
    DEFAULT_OPTIMIZER,
    DEFAULT_LEARNING_RATE
)
from .data_collection import (
    get_all_midi_files,
    seed_sample_datasets,
    inspect_midi_file
)
from .preprocessing import (
    run_preprocessing_pipeline,
    get_preprocess_status
)
from .model import (
    build_lstm_model,
    get_current_model_metadata
)
from .train import (
    start_training_job,
    stop_training_job,
    get_training_status
)
from .generate import (
    generate_music_sequence,
    generate_variations,
    get_generation_history
)
from .gan_experimental import get_gan_overview

app = FastAPI(
    title="MelodyMind API",
    description="Backend REST API for AI Music Generation with LSTMs and MIDI preprocessing",
    version="1.0.0"
)

# Enable CORS for local dev and frontend preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Models ---
class PreprocessRequest(BaseModel):
    sequence_length: int = Field(default=100, ge=32, le=200)
    transpose: bool = True
    include_chords: bool = True
    include_durations: bool = False


class ModelBuildRequest(BaseModel):
    architecture: str = "LSTM"
    lstm_layers: int = Field(default=DEFAULT_LSTM_LAYERS, ge=1, le=4)
    units: int = Field(default=DEFAULT_LSTM_UNITS, ge=64, le=1024)
    dropout: float = Field(default=DEFAULT_DROPOUT, ge=0.0, le=0.7)
    dense_units: int = Field(default=DEFAULT_DENSE_UNITS, ge=64, le=512)
    optimizer: str = DEFAULT_OPTIMIZER
    learning_rate: float = DEFAULT_LEARNING_RATE
    sequence_length: Optional[int] = 100
    vocab_size: Optional[int] = 64


class TrainRequest(BaseModel):
    epochs: int = Field(default=50, ge=1, le=200)
    batch_size: int = Field(default=64, ge=16, le=256)
    quick_demo: bool = False
    model_params: Optional[dict] = None


class GenerateRequest(BaseModel):
    num_notes: int = Field(default=150, ge=20, le=1000)
    temperature: float = Field(default=0.8, ge=0.1, le=2.0)
    tempo: int = Field(default=120, ge=40, le=240)
    instrument: str = "Acoustic Grand Piano"
    custom_seed: Optional[List[str]] = None


# --- Endpoints ---

@app.on_event("startup")
def on_startup():
    """Ensure sample datasets are initialized on startup."""
    seed_sample_datasets()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MelodyMind – AI Music Generator", "version": "1.0.0"}


# Step 1: Collect MIDI Data
@app.get("/api/files")
def list_midi_files():
    """Retrieve list of all active MIDI files and metadata."""
    files = get_all_midi_files()
    return {"files": files, "count": len(files)}


@app.post("/api/download-sample-dataset")
def download_sample_dataset():
    """Seeds classical and jazz public-domain MIDI files."""
    res = seed_sample_datasets()
    files = get_all_midi_files()
    return {"result": res, "files": files}


@app.post("/api/upload-midi")
async def upload_midi_files(
    file: UploadFile = File(...),
    genre: str = Form("Classical")
):
    """Handles upload of user-provided .mid/.midi files (size limit 10MB)."""
    if not file.filename.lower().endswith((".mid", ".midi")):
        raise HTTPException(status_code=400, detail="Only .mid and .midi files are supported.")

    target_dir = JAZZ_DIR if genre.lower() == "jazz" else CLASSICAL_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    destination = target_dir / file.filename

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    info = inspect_midi_file(destination)
    return {"status": "success", "file": info}


@app.delete("/api/files/{file_id}")
def delete_midi_file(file_id: str):
    """Deletes a MIDI file from the dataset."""
    found = False
    for ext in ["*.mid", "*.midi"]:
        for f in MIDI_DIR.rglob(ext):
            if f.stem == file_id:
                f.unlink()
                found = True
                break
    if not found:
        raise HTTPException(status_code=404, detail="File not found")
    return {"status": "success", "message": f"File {file_id} deleted"}


# Step 2: Preprocessing
@app.post("/api/preprocess")
def start_preprocessing(req: PreprocessRequest, background_tasks: BackgroundTasks):
    """Executes music21 note sequence extraction in background task."""
    background_tasks.add_task(
        run_preprocessing_pipeline,
        sequence_length=req.sequence_length,
        transpose=req.transpose,
        include_chords=req.include_chords,
        include_durations=req.include_durations
    )
    return {"status": "started", "message": "Preprocessing initialized"}


@app.get("/api/preprocess/status")
def preprocess_status():
    """Poll preprocessing progress, tokens extracted, and vocab stats."""
    return get_preprocess_status()


# Step 3: Model Building
@app.post("/api/model/build")
def build_model(req: ModelBuildRequest):
    """Builds and compiles Keras LSTM model architecture."""
    _, meta = build_lstm_model(
        sequence_length=req.sequence_length or 100,
        vocab_size=req.vocab_size or 64,
        params=req.dict()
    )
    return {"status": "built", "model": meta}


@app.get("/api/model/summary")
def get_model_summary():
    """Returns layers, parameter counts, and ASCII summary."""
    return get_current_model_metadata()


@app.get("/api/model/gan-overview")
def get_gan_info():
    """Educational details on experimental GAN architecture."""
    return get_gan_overview()


# Step 4: Training
@app.post("/api/train/start")
def train_start(req: TrainRequest):
    """Starts model training loop with live telemetry."""
    res = start_training_job(
        epochs=req.epochs,
        batch_size=req.batch_size,
        quick_demo=req.quick_demo,
        model_params=req.model_params
    )
    return res


@app.post("/api/train/stop")
def train_stop():
    """Halts training loop."""
    return stop_training_job()


@app.get("/api/train/status")
def train_status():
    """Poll live loss, accuracy, epoch ETA, and training curves."""
    return get_training_status()


# Step 5: Generation and Playback
@app.post("/api/generate")
def generate_music(req: GenerateRequest):
    """Samples new musical note sequences with temperature scaling."""
    res = generate_music_sequence(
        num_notes=req.num_notes,
        temperature=req.temperature,
        tempo=req.tempo,
        instrument=req.instrument,
        custom_seed=req.custom_seed
    )
    return res


@app.post("/api/generate/variations")
def generate_music_variations(
    num_notes: int = Form(80),
    tempo: int = Form(120),
    instrument: str = Form("Acoustic Grand Piano")
):
    """Generates 3 variations at conservative, balanced, and creative temperatures."""
    res = generate_variations(num_notes=num_notes, tempo=tempo, instrument=instrument)
    return {"variations": res}


@app.get("/api/outputs")
def list_outputs():
    """Lists generated compositions."""
    return {"outputs": get_generation_history()}


@app.get("/api/outputs/{output_id}/midi")
def download_midi(output_id: str):
    """Downloads .mid file for specified generation."""
    for f in OUTPUTS_DIR.glob(f"*{output_id}*.mid"):
        return FileResponse(
            f,
            media_type="audio/midi",
            filename=f.name
        )
    raise HTTPException(status_code=404, detail="MIDI file not found")


@app.get("/api/outputs/{output_id}/audio")
def download_audio(output_id: str):
    """Downloads rendered audio (.wav) if available."""
    for f in OUTPUTS_DIR.glob(f"*{output_id}*.wav"):
        return FileResponse(
            f,
            media_type="audio/wav",
            filename=f.name
        )
    raise HTTPException(status_code=404, detail="Audio file not rendered or FluidSynth not present")
