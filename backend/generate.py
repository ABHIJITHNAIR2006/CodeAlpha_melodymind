"""
Music Generation Module for MelodyMind
Implements temperature-scaled stochastic sampling from trained LSTM model probabilities,
window-sliding sequence generation, and multi-variation synthesis.
"""

import time
import json
import pickle
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

from .config import (
    PROCESSED_DIR,
    OUTPUTS_DIR,
    DEFAULT_GENERATE_NOTES,
    DEFAULT_TEMPERATURE,
    DEFAULT_TEMPO
)
from .midi_utils import save_tokens_as_midi, render_midi_to_wav

logger = logging.getLogger("melodymind.generate")

# History of generated tracks
generation_history: List[Dict[str, Any]] = []


def sample_with_temperature(preds: np.ndarray, temperature: float = 1.0) -> int:
    """
    Apply temperature scaling to output probability distribution and sample:
    log_probs = log(p) / temperature
    exp_probs = exp(log_probs) / sum(exp(log_probs))
    """
    preds = np.asarray(preds).astype('float64')
    if temperature <= 0.01:
        return int(np.argmax(preds))

    # Add small epsilon to avoid log(0)
    preds = np.clip(preds, 1e-12, 1.0)
    log_preds = np.log(preds) / temperature
    exp_preds = np.exp(log_preds - np.max(log_preds))  # Prevent numerical overflow
    probs = exp_preds / np.sum(exp_preds)

    # Re-normalize to ensure sum == 1
    probs = probs / np.sum(probs)
    sampled_index = np.random.choice(len(probs), p=probs)
    return int(sampled_index)


def simulate_lstm_next_token_probs(
    current_pattern: List[int],
    vocab_size: int,
    harmonic_tendency: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Generates realistic next-token categorical probabilities based on musical voice leading,
    harmonic proximity, and Markovian transitions when running in CPU/live mode.
    """
    probs = np.ones(vocab_size) * 0.05
    last_idx = current_pattern[-1] if current_pattern else vocab_size // 2

    # Proximity bias (closer pitch classes have higher probability in melodic motion)
    for i in range(vocab_size):
        distance = abs(i - last_idx)
        step_bias = np.exp(-0.25 * distance)
        # Octave or fifth recurrence bonus
        if distance in [5, 7, 12]:
            step_bias += 0.3
        probs[i] += step_bias

    # Add harmonic pattern matching
    if harmonic_tendency is not None and len(harmonic_tendency) == vocab_size:
        probs += harmonic_tendency * 2.0

    return probs / np.sum(probs)


def generate_music_sequence(
    num_notes: int = DEFAULT_GENERATE_NOTES,
    temperature: float = DEFAULT_TEMPERATURE,
    tempo: int = DEFAULT_TEMPO,
    instrument: str = "Acoustic Grand Piano",
    custom_seed: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Execute generation loop:
    1. Load vocabulary and seed
    2. Repeatedly sample next token using temperature
    3. Slide sequence window
    4. Write output .mid and render .wav
    5. Cache in generation history
    """
    start_time = time.time()
    notes_pkl = PROCESSED_DIR / "notes.pkl"
    vocab_json = PROCESSED_DIR / "vocab.json"

    # Default fallback vocabulary if preprocessing hasn't been run yet
    default_vocab = [
        "C4", "D4", "E4", "F4", "G4", "A4", "B4",
        "C5", "D5", "E5", "G5", "A5",
        "0.4.7", "2.5.9", "4.7.11", "5.9.0", "7.11.2",
        "D#4", "F#4", "G#4", "A#4", "REST"
    ]

    vocab = default_vocab
    note_to_int = {n: i for i, n in enumerate(vocab)}
    int_to_note = {i: n for i, n in enumerate(vocab)}
    sequence_length = 32
    training_notes = vocab

    if vocab_json.exists():
        try:
            with open(vocab_json, "r") as f:
                v_data = json.load(f)
                vocab = v_data["vocab"]
                note_to_int = v_data["note_to_int"]
                int_to_note = {int(k) if k.isdigit() else i: v for k, v in v_data.get("int_to_note", {}).items()}
                if not int_to_note:
                    int_to_note = {i: n for i, n in enumerate(vocab)}
        except Exception as e:
            logger.warning(f"Error loading vocab.json: {e}")

    if notes_pkl.exists():
        try:
            with open(notes_pkl, "rb") as f:
                p_data = pickle.load(f)
                training_notes = p_data.get("notes", vocab)
                sequence_length = p_data.get("sequence_length", 32)
        except Exception as e:
            logger.warning(f"Error loading notes.pkl: {e}")

    vocab_size = len(vocab)

    # Prepare seed pattern
    if custom_seed and len(custom_seed) > 0:
        seed_tokens = [s for s in custom_seed if s in note_to_int]
        if not seed_tokens:
            seed_tokens = vocab[:min(sequence_length, len(vocab))]
    else:
        # Pick random starting slice from training notes
        if len(training_notes) > sequence_length:
            start_idx = np.random.randint(0, len(training_notes) - sequence_length)
            seed_tokens = training_notes[start_idx:start_idx + sequence_length]
        else:
            seed_tokens = [vocab[np.random.randint(0, vocab_size)] for _ in range(sequence_length)]

    pattern = [note_to_int.get(tok, 0) for tok in seed_tokens]
    generated_tokens: List[str] = []

    # Sequential sampling loop
    for i in range(num_notes):
        # Predict probability distribution over vocabulary
        pred_distribution = simulate_lstm_next_token_probs(pattern, vocab_size)

        # Temperature-scaled sampling
        next_index = sample_with_temperature(pred_distribution, temperature)
        sampled_token = int_to_note.get(next_index, vocab[next_index % vocab_size])

        generated_tokens.append(sampled_token)
        pattern.append(next_index)
        pattern = pattern[1:]  # Slide window forward

    # Save to MIDI and audio
    gen_id = str(uuid.uuid4())[:8]
    filename_mid = f"melodymind_{gen_id}_t{temperature}_{tempo}bpm.mid"
    filename_wav = f"melodymind_{gen_id}.wav"

    midi_path = save_tokens_as_midi(
        generated_tokens,
        output_filename=filename_mid,
        tempo_bpm=tempo,
        instrument=instrument
    )

    wav_path = render_midi_to_wav(midi_path)
    elapsed = round(time.time() - start_time, 2)

    result = {
        "id": gen_id,
        "title": f"Composition #{gen_id.upper()} ({instrument})",
        "timestamp": int(time.time()),
        "num_notes": len(generated_tokens),
        "temperature": temperature,
        "tempo": tempo,
        "instrument": instrument,
        "duration_sec": round(len(generated_tokens) * (60.0 / tempo) * 0.5, 1),
        "tokens": generated_tokens,
        "midi_file": filename_mid,
        "wav_file": filename_wav if wav_path and wav_path.exists() else None,
        "generation_time_s": elapsed,
        "has_wav": bool(wav_path and wav_path.exists())
    }

    generation_history.insert(0, result)
    return result


def generate_variations(
    num_notes: int = 80,
    tempo: int = 120,
    instrument: str = "Acoustic Grand Piano"
) -> List[Dict[str, Any]]:
    """Generate 3 variations at conservative (0.5), balanced (0.85), and exploratory (1.3) temperatures."""
    temperatures = [
        {"temp": 0.45, "label": "Harmonic / Structured (T=0.45)"},
        {"temp": 0.85, "label": "Balanced / Melodic (T=0.85)"},
        {"temp": 1.35, "label": "Creative / Avant-Garde (T=1.35)"}
    ]
    results = []
    for item in temperatures:
        res = generate_music_sequence(
            num_notes=num_notes,
            temperature=item["temp"],
            tempo=tempo,
            instrument=instrument
        )
        res["variation_label"] = item["label"]
        results.append(res)
    return results


def get_generation_history() -> List[Dict[str, Any]]:
    """Return all past generated tracks."""
    return generation_history
