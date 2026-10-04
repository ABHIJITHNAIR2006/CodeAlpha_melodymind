"""
Preprocessing Module for MelodyMind
Parses MIDI files using music21, extracts notes/chords, normalizes tonality,
constructs token vocabularies, and builds sliding window sequences for LSTM training.
"""

import os
import json
import pickle
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional
from collections import Counter
import numpy as np

import music21
from .config import MIDI_DIR, PROCESSED_DIR, SEQUENCE_LENGTH, TRANSPOSE_TO_C, INCLUDE_CHORDS

logger = logging.getLogger("melodymind.preprocessing")

# In-memory status tracker for real-time frontend streaming
preprocess_state = {
    "is_running": False,
    "progress": 0,
    "current_file": "",
    "logs": [],
    "completed": False,
    "error": None,
    "stats": None
}


def log_step(msg: str):
    logger.info(msg)
    preprocess_state["logs"].append(msg)
    if len(preprocess_state["logs"]) > 200:
        preprocess_state["logs"].pop(0)


def transpose_to_c_major(score: music21.stream.Score) -> music21.stream.Score:
    """Transpose a music21 score to C major / A minor for key invariance."""
    try:
        key = score.analyze('key')
        if key.mode == "major":
            interval = music21.interval.Interval(key.tonic, music21.pitch.Pitch('C'))
        else:
            interval = music21.interval.Interval(key.tonic, music21.pitch.Pitch('A'))
        transposed = score.transpose(interval)
        return transposed
    except Exception as e:
        logger.debug(f"Key analysis failed, proceeding without transpose: {e}")
        return score


def extract_notes_from_midi(filepath: Path, transpose: bool = True, include_chords: bool = True) -> List[str]:
    """
    Parse a MIDI file and extract a sequential list of Note / Chord tokens.
    Chords are represented as dot-separated pitch classes or semitones (e.g. '4.7.11' or 'C4.E4.G4').
    """
    notes_list: List[str] = []
    try:
        midi_data = music21.converter.parse(str(filepath))
        if transpose:
            midi_data = transpose_to_c_major(midi_data)

        parts = music21.instrument.partitionByInstrument(midi_data)
        if parts:  # File has instrument parts
            elements_to_parse = parts.parts[0].recurse()
        else:  # Flat notes
            elements_to_parse = midi_data.flat.notes

        for element in elements_to_parse:
            # Check for single Note
            if isinstance(element, music21.note.Note):
                notes_list.append(str(element.pitch))
            # Check for Chord
            elif isinstance(element, music21.chord.Chord) and include_chords:
                # Store chord as dot-separated pitch names or pitch classes
                chord_token = '.'.join(str(n) for n in element.normalOrder)
                notes_list.append(chord_token)
            # Rests can also be recorded if desired
            elif isinstance(element, music21.note.Rest):
                notes_list.append("REST")

    except Exception as e:
        logger.warning(f"Error parsing {filepath.name}: {e}")

    return notes_list


def run_preprocessing_pipeline(
    sequence_length: int = SEQUENCE_LENGTH,
    transpose: bool = TRANSPOSE_TO_C,
    include_chords: bool = INCLUDE_CHORDS,
    include_durations: bool = False
) -> Dict[str, Any]:
    """
    Full preprocessing execution:
    1. Parses all MIDI files in backend/data/midi
    2. Builds notes list
    3. Builds vocabulary & mapping
    4. Generates sliding window input/target sequences
    5. Saves notes.pkl, vocab.json
    6. Returns rich stats for visualization
    """
    global preprocess_state
    preprocess_state["is_running"] = True
    preprocess_state["completed"] = False
    preprocess_state["progress"] = 0
    preprocess_state["logs"] = []
    preprocess_state["error"] = None

    try:
        log_step("Starting preprocessing pipeline...")
        all_midi_files = list(MIDI_DIR.rglob("*.mid")) + list(MIDI_DIR.rglob("*.midi"))

        if not all_midi_files:
            raise ValueError("No MIDI files found in dataset directory. Please upload or seed files first.")

        log_step(f"Found {len(all_midi_files)} MIDI files across directories.")
        all_notes: List[str] = []

        for idx, file_path in enumerate(all_midi_files):
            preprocess_state["current_file"] = file_path.name
            preprocess_state["progress"] = int((idx / len(all_midi_files)) * 60)
            log_step(f"[{idx+1}/{len(all_midi_files)}] Parsing '{file_path.name}'...")

            file_notes = extract_notes_from_midi(file_path, transpose=transpose, include_chords=include_chords)
            if file_notes:
                all_notes.extend(file_notes)
                log_step(f"  -> Extracted {len(file_notes)} tokens from {file_path.name}")
            else:
                log_step(f"  -> Warning: 0 notes extracted from {file_path.name}")

        if not all_notes:
            raise ValueError("Failed to extract any notes from the provided MIDI files.")

        log_step(f"Total tokens extracted across all files: {len(all_notes):,}")
        preprocess_state["progress"] = 70

        # Build vocabulary (sorted unique tokens)
        vocab = sorted(list(set(all_notes)))
        vocab_size = len(vocab)
        log_step(f"Unique vocabulary size: {vocab_size} distinct pitch/chord tokens.")

        # Create bi-directional mappings
        note_to_int = {note: i for i, note in enumerate(vocab)}
        int_to_note = {i: note for i, note in enumerate(vocab)}

        # Create sliding window sequences
        log_step(f"Constructing sliding window training sequences (length = {sequence_length})...")
        network_input = []
        network_output = []

        if len(all_notes) <= sequence_length:
            # Pad or duplicate if sample is tiny
            repeat_factor = (sequence_length + 20) // len(all_notes) + 1
            all_notes = (all_notes * repeat_factor)[:sequence_length + 50]

        for i in range(0, len(all_notes) - sequence_length, 1):
            sequence_in = all_notes[i:i + sequence_length]
            sequence_out = all_notes[i + sequence_length]
            network_input.append([note_to_int[char] for char in sequence_in])
            network_output.append(note_to_int[sequence_out])

        n_patterns = len(network_input)
        log_step(f"Generated {n_patterns:,} training sequences.")
        preprocess_state["progress"] = 85

        # Save artifacts
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        notes_pkl_path = PROCESSED_DIR / "notes.pkl"
        vocab_json_path = PROCESSED_DIR / "vocab.json"
        metadata_path = PROCESSED_DIR / "metadata.json"

        with open(notes_pkl_path, "wb") as f:
            pickle.dump({
                "notes": all_notes,
                "network_input": network_input,
                "network_output": network_output,
                "sequence_length": sequence_length
            }, f)

        with open(vocab_json_path, "w") as f:
            json.dump({
                "vocab": vocab,
                "note_to_int": note_to_int,
                "int_to_note": int_to_note,
                "vocab_size": vocab_size
            }, f, indent=2)

        # Calculate statistics for UI
        counter = Counter(all_notes)
        top_20_notes = [{"note": k, "count": v} for k, v in counter.most_common(20)]

        # Sample before/after
        sample_raw = all_notes[:min(10, len(all_notes))]
        sample_indices = [note_to_int[n] for n in sample_raw]

        stats = {
            "total_tokens": len(all_notes),
            "vocab_size": vocab_size,
            "num_sequences": n_patterns,
            "sequence_length": sequence_length,
            "top_notes": top_20_notes,
            "sample_raw": sample_raw,
            "sample_indices": sample_indices,
            "files_processed": len(all_midi_files)
        }

        with open(metadata_path, "w") as f:
            json.dump(stats, f, indent=2)

        preprocess_state["progress"] = 100
        preprocess_state["is_running"] = False
        preprocess_state["completed"] = True
        preprocess_state["stats"] = stats
        log_step("Preprocessing completed successfully! Ready for model training.")

        return stats

    except Exception as e:
        logger.error(f"Preprocessing error: {e}", exc_info=True)
        preprocess_state["is_running"] = False
        preprocess_state["completed"] = False
        preprocess_state["error"] = str(e)
        log_step(f"Error: {e}")
        raise e


def get_preprocess_status() -> Dict[str, Any]:
    """Retrieve current preprocessing state for live UI polling."""
    return preprocess_state
