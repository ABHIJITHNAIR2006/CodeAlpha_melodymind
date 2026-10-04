"""
Unit Tests for MelodyMind Preprocessing, Model Building, and Generation
Run with: pytest backend/tests/test_pipeline.py
"""

import os
import sys
from pathlib import Path
import numpy as np
import pytest

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from data_collection import note_name_to_midi, seed_sample_datasets
from preprocessing import extract_notes_from_midi
from model import build_lstm_model
from generate import sample_with_temperature, simulate_lstm_next_token_probs
from midi_utils import tokens_to_music21_stream


def test_note_name_to_midi():
    """Verify standard pitch conversions."""
    assert note_name_to_midi("C4") == 60
    assert note_name_to_midi("A4") == 69
    assert note_name_to_midi("C5") == 72
    assert note_name_to_midi("D#4") == 63
    assert note_name_to_midi("Eb4") == 63


def test_seed_sample_datasets():
    """Verify sample MIDI generation."""
    res = seed_sample_datasets()
    assert res["status"] == "success"


def test_model_parameter_calculation():
    """Verify LSTM parameter calculation logic without requiring GPU."""
    _, meta = build_lstm_model(
        sequence_length=100,
        vocab_size=50,
        params={
            "lstm_layers": 3,
            "units": 256,
            "dropout": 0.3,
            "dense_units": 256
        }
    )
    assert meta["total_params"] > 500000
    assert meta["architecture"] == "LSTM"
    assert len(meta["layers"]) >= 6


def test_temperature_sampling():
    """Verify temperature scaling behavior."""
    logits = np.array([0.05, 0.1, 0.8, 0.05])
    # Very low temperature should sample argmax almost deterministically
    sampled_greedy = sample_with_temperature(logits, temperature=0.01)
    assert sampled_greedy == 2

    # High temperature should sample within valid bounds
    sampled_rand = sample_with_temperature(logits, temperature=1.5)
    assert 0 <= sampled_rand < 4


def test_simulate_next_token_probs():
    """Verify probability vector sums to 1.0."""
    pattern = [10, 12, 14, 15]
    probs = simulate_lstm_next_token_probs(pattern, vocab_size=30)
    assert len(probs) == 30
    assert np.isclose(np.sum(probs), 1.0)


def test_tokens_to_music21_stream():
    """Verify music21 stream construction from notes and chords."""
    tokens = ["C4", "E4", "G4", "4.7.11", "REST", "C5"]
    stream = tokens_to_music21_stream(tokens, tempo_bpm=120)
    assert stream is not None
    # Check that stream contains notes and chords
    elements = list(stream.flat.notesAndRests)
    assert len(elements) >= 5
