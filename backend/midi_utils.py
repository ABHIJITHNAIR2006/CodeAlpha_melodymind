"""
MIDI Utilities Module for MelodyMind
Handles token-to-music21 conversion, standard MIDI (.mid) stream generation,
and audio rendering via FluidSynth with graceful browser audio fallback.
"""

import os
import shutil
import subprocess
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import music21
from .config import OUTPUTS_DIR, SOUNDFONT_PATH

logger = logging.getLogger("melodymind.midi_utils")


def tokens_to_music21_stream(
    tokens: List[str],
    tempo_bpm: int = 120,
    instrument_name: str = "Acoustic Grand Piano",
    step_offset: float = 0.5
) -> music21.stream.Stream:
    """
    Convert a list of string note/chord tokens into a music21 Stream.
    step_offset: time distance in quarter notes (0.5 = eighth notes)
    """
    stream = music21.stream.Stream()

    # Set Tempo
    mm = music21.tempo.MetronomeMark(number=tempo_bpm)
    stream.append(mm)

    # Set Instrument
    instr = music21.instrument.Piano()
    if "guitar" in instrument_name.lower():
        instr = music21.instrument.AcousticGuitar()
    elif "violin" in instrument_name.lower() or "string" in instrument_name.lower():
        instr = music21.instrument.Violin()
    elif "flute" in instrument_name.lower():
        instr = music21.instrument.Flute()
    elif "trumpet" in instrument_name.lower() or "brass" in instrument_name.lower():
        instr = music21.instrument.Trumpet()
    stream.append(instr)

    curr_offset = 0.0

    for token in tokens:
        token = str(token).strip()

        # Handle Rest
        if token.upper() == "REST":
            rest_obj = music21.note.Rest(quarterLength=step_offset)
            rest_obj.offset = curr_offset
            stream.append(rest_obj)
            curr_offset += step_offset
            continue

        # Handle Chord (indicated by dot notation or pitch classes, e.g. "4.7.11" or "C4.E4.G4")
        if "." in token:
            parts = token.split(".")
            chord_notes = []
            for p in parts:
                try:
                    if p.isdigit():
                        # Pitch class integer (0=C, 1=C#, etc.), place in 4th octave
                        pc = int(p)
                        pitch_obj = music21.pitch.Pitch()
                        pitch_obj.pitchClass = pc
                        pitch_obj.octave = 4
                        n = music21.note.Note(pitch_obj)
                    else:
                        n = music21.note.Note(p)
                    chord_notes.append(n)
                except Exception:
                    pass

            if chord_notes:
                chord_obj = music21.chord.Chord(chord_notes)
                chord_obj.quarterLength = step_offset
                chord_obj.offset = curr_offset
                stream.append(chord_obj)
                curr_offset += step_offset
            continue

        # Handle Single Note (e.g. "C4", "F#5", "Bb3")
        try:
            note_obj = music21.note.Note(token)
            note_obj.quarterLength = step_offset
            note_obj.offset = curr_offset
            stream.append(note_obj)
            curr_offset += step_offset
        except Exception as e:
            logger.debug(f"Could not parse token '{token}' as Note: {e}")
            # Fallback as middle C note
            try:
                note_obj = music21.note.Note("C4")
                note_obj.quarterLength = step_offset
                note_obj.offset = curr_offset
                stream.append(note_obj)
                curr_offset += step_offset
            except Exception:
                pass

    return stream


def save_tokens_as_midi(
    tokens: List[str],
    output_filename: str,
    tempo_bpm: int = 120,
    instrument: str = "Piano"
) -> Path:
    """Save generated tokens directly to a .mid file."""
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUTS_DIR / output_filename
    score = tokens_to_music21_stream(tokens, tempo_bpm=tempo_bpm, instrument_name=instrument)
    score.write('midi', fp=str(out_path))
    logger.info(f"Saved MIDI output to {out_path}")
    return out_path


def render_midi_to_wav(midi_path: Path, output_wav_path: Optional[Path] = None) -> Optional[Path]:
    """
    Renders MIDI to WAV using FluidSynth executable if available on system.
    Returns path to WAV or None if FluidSynth or SoundFont is not found.
    """
    if output_wav_path is None:
        output_wav_path = midi_path.with_suffix(".wav")

    fluidsynth_bin = shutil.which("fluidsynth")
    if not fluidsynth_bin:
        logger.warning("FluidSynth executable not located in system PATH. Browser Tone.js audio will be used.")
        return None

    if not SOUNDFONT_PATH.exists():
        # Check standard Linux soundfont paths
        alt_soundfonts = [
            Path("/usr/share/sounds/sf2/FluidR3_GM.sf2"),
            Path("/usr/share/sounds/sf2/default-GM.sf2"),
            Path("/usr/share/soundfonts/default.sf2")
        ]
        sf_path = None
        for p in alt_soundfonts:
            if p.exists():
                sf_path = p
                break
        if not sf_path:
            logger.warning("No .sf2 SoundFont found on host. Gracefully using browser synthesizer.")
            return None
    else:
        sf_path = SOUNDFONT_PATH

    try:
        cmd = [
            fluidsynth_bin,
            "-ni",
            str(sf_path),
            str(midi_path),
            "-F",
            str(output_wav_path),
            "-r",
            "44100"
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        logger.info(f"Rendered WAV using FluidSynth to {output_wav_path}")
        return output_wav_path
    except Exception as e:
        logger.warning(f"FluidSynth execution failed: {e}. Falling back to browser audio.")
        return None
