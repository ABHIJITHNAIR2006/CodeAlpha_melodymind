"""
Data Collection Module for MelodyMind
Handles dataset downloads, file uploads, and sample MIDI dataset bundling.
"""

import os
import shutil
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import mido

from .config import CLASSICAL_DIR, JAZZ_DIR, MIDI_DIR

logger = logging.getLogger("melodymind.data_collection")
logging.basicConfig(level=logging.INFO)

# Built-in sample compositions (notes, duration_in_quarter_notes)
SAMPLE_SONGS = {
    "classical_beethoven_fur_elise.mid": {
        "genre": "Classical",
        "title": "Für Elise - Ludwig van Beethoven",
        "notes": [
            ("E5", 0.5), ("D#5", 0.5), ("E5", 0.5), ("D#5", 0.5), ("E5", 0.5),
            ("B4", 0.5), ("D5", 0.5), ("C5", 0.5), ("A4", 1.0),
            ("C4", 0.5), ("E4", 0.5), ("A4", 0.5), ("B4", 1.0),
            ("E4", 0.5), ("G#4", 0.5), ("B4", 0.5), ("C5", 1.0),
            ("E4", 0.5), ("E5", 0.5), ("D#5", 0.5), ("E5", 0.5), ("D#5", 0.5),
            ("E5", 0.5), ("B4", 0.5), ("D5", 0.5), ("C5", 0.5), ("A4", 1.0)
        ]
    },
    "classical_mozart_nachtmusik.mid": {
        "genre": "Classical",
        "title": "Eine kleine Nachtmusik - W. A. Mozart",
        "notes": [
            ("G4", 1.0), ("D4", 0.5), ("G4", 1.0), ("D4", 0.5),
            ("G4", 0.5), ("D4", 0.5), ("G4", 0.5), ("B4", 0.5), ("D5", 1.5),
            ("C5", 1.0), ("A4", 0.5), ("C5", 1.0), ("A4", 0.5),
            ("C5", 0.5), ("A4", 0.5), ("F#4", 0.5), ("A4", 0.5), ("D4", 1.5)
        ]
    },
    "classical_bach_minuet_g.mid": {
        "genre": "Classical",
        "title": "Minuet in G major - J. S. Bach",
        "notes": [
            ("D5", 1.0), ("G4", 0.5), ("A4", 0.5), ("B4", 0.5), ("C5", 0.5),
            ("D5", 1.0), ("G4", 1.0), ("G4", 1.0),
            ("E5", 1.0), ("C5", 0.5), ("D5", 0.5), ("E5", 0.5), ("F#5", 0.5),
            ("G5", 1.0), ("G4", 1.0), ("G4", 1.0),
            ("C5", 1.0), ("D5", 0.5), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5),
            ("B4", 1.0), ("C5", 0.5), ("B4", 0.5), ("A4", 0.5), ("G4", 0.5),
            ("F#4", 1.0), ("G4", 0.5), ("A4", 0.5), ("B4", 0.5), ("G4", 0.5),
            ("A4", 2.0)
        ]
    },
    "jazz_autumn_leaves_riff.mid": {
        "genre": "Jazz",
        "title": "Autumn Leaves Motif - Jazz Standard",
        "notes": [
            ("E4", 1.0), ("F#4", 1.0), ("G4", 1.0), ("C5", 3.0),
            ("D4", 1.0), ("E4", 1.0), ("F#4", 1.0), ("B4", 3.0),
            ("C4", 1.0), ("D4", 1.0), ("E4", 1.0), ("A4", 3.0),
            ("B3", 1.0), ("C4", 1.0), ("D#4", 1.0), ("G4", 3.0)
        ]
    },
    "jazz_blue_monk_blues.mid": {
        "genre": "Jazz",
        "title": "Blues Progression - Thelonious Monk Style",
        "notes": [
            ("Bb3", 0.5), ("D4", 0.5), ("F4", 0.5), ("Ab4", 1.0),
            ("G4", 0.5), ("F4", 0.5), ("D4", 0.5), ("F4", 1.0),
            ("Eb4", 0.5), ("G4", 0.5), ("Bb4", 0.5), ("Db5", 1.0),
            ("C5", 0.5), ("Bb4", 0.5), ("G4", 0.5), ("Bb4", 1.0),
            ("F4", 0.5), ("A4", 0.5), ("C5", 0.5), ("Eb5", 1.0),
            ("D5", 0.5), ("C5", 0.5), ("A4", 0.5), ("Bb4", 2.0)
        ]
    }
}


def note_name_to_midi(name: str) -> int:
    """Convert pitch name like 'C4', 'D#5', 'Bb3' to MIDI number (0-127)."""
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    name = name.strip()
    # Normalize flats
    flats = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}
    for fl, sh in flats.items():
        if name.startswith(fl):
            name = sh + name[len(fl):]
            break

    if len(name) < 2:
        return 60
    if '#' in name:
        letter = name[:2]
        octave = int(name[2:])
    else:
        letter = name[:1]
        octave = int(name[1:])

    pitch_class = notes.index(letter) if letter in notes else 0
    return (octave + 1) * 12 + pitch_class


def create_sample_midi_file(filepath: Path, notes_list: List[tuple], tempo_bpm: int = 120):
    """Write standard MIDI file with given note sequence using mido."""
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    mid.tracks.append(track)

    # Set tempo
    tempo = mido.bpm2tempo(tempo_bpm)
    track.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
    track.append(mido.MetaMessage('track_name', name=filepath.stem, time=0))

    for note_str, duration in notes_list:
        midi_pitch = note_name_to_midi(note_str)
        ticks = int(duration * 480)
        track.append(mido.Message('note_on', note=midi_pitch, velocity=90, time=0))
        track.append(mido.Message('note_off', note=midi_pitch, velocity=64, time=ticks))

    track.append(mido.MetaMessage('end_of_track', time=0))
    mid.save(str(filepath))


def seed_sample_datasets() -> Dict[str, Any]:
    """Populate sample classical and jazz MIDI files if not already present."""
    created = []
    for filename, info in SAMPLE_SONGS.items():
        genre_folder = CLASSICAL_DIR if info["genre"].lower() == "classical" else JAZZ_DIR
        target_path = genre_folder / filename
        if not target_path.exists():
            create_sample_midi_file(target_path, info["notes"])
            created.append(str(target_path))

    return {
        "status": "success",
        "message": f"Successfully initialized {len(created)} sample MIDI files.",
        "files_created": created
    }


def inspect_midi_file(filepath: Path) -> Dict[str, Any]:
    """Extract metadata: duration, track count, total notes, tempo."""
    try:
        mid = mido.MidiFile(str(filepath))
        notes_count = 0
        for track in mid.tracks:
            for msg in track:
                if msg.type == 'note_on' and msg.velocity > 0:
                    notes_count += 1

        genre = "Classical" if "classical" in str(filepath).lower() else ("Jazz" if "jazz" in str(filepath).lower() else "Custom")
        return {
            "id": filepath.stem,
            "filename": filepath.name,
            "genre": genre,
            "duration": round(mid.length, 2),
            "tracks": len(mid.tracks),
            "notes_count": notes_count,
            "size_kb": round(filepath.stat().st_size / 1024, 2),
            "path": str(filepath)
        }
    except Exception as e:
        logger.warning(f"Failed to inspect {filepath}: {e}")
        return {
            "id": filepath.stem,
            "filename": filepath.name,
            "genre": "Custom",
            "duration": 0,
            "tracks": 1,
            "notes_count": 0,
            "size_kb": round(filepath.stat().st_size / 1024, 2) if filepath.exists() else 0,
            "path": str(filepath),
            "error": str(e)
        }


def get_all_midi_files() -> List[Dict[str, Any]]:
    """Scan all MIDI directories and return rich metadata for the UI."""
    files = []
    # Ensure samples are seeded
    seed_sample_datasets()

    for ext in ["*.mid", "*.midi"]:
        for file in MIDI_DIR.rglob(ext):
            files.append(inspect_midi_file(file))
    return files
