# MelodyMind Backend Configuration
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MIDI_DIR = DATA_DIR / "midi"
CLASSICAL_DIR = MIDI_DIR / "classical"
JAZZ_DIR = MIDI_DIR / "jazz"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = DATA_DIR / "models"
OUTPUTS_DIR = DATA_DIR / "outputs"

# Create directories if they do not exist
for path in [DATA_DIR, MIDI_DIR, CLASSICAL_DIR, JAZZ_DIR, PROCESSED_DIR, MODELS_DIR, OUTPUTS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# Preprocessing Hyperparameters
SEQUENCE_LENGTH = 100
MIN_SEQUENCE_LENGTH = 32
MAX_SEQUENCE_LENGTH = 200
DEFAULT_STEP_SIZE = 1
OCTAVE_RANGE = (2, 7)  # Note filtering range
TRANSPOSE_TO_C = True
INCLUDE_CHORDS = True
INCLUDE_DURATIONS = False

# Model Hyperparameters
DEFAULT_LSTM_LAYERS = 3
DEFAULT_LSTM_UNITS = 256
DEFAULT_DROPOUT = 0.3
DEFAULT_DENSE_UNITS = 256
DEFAULT_OPTIMIZER = "adam"
DEFAULT_LEARNING_RATE = 0.001
DEFAULT_BATCH_SIZE = 64
DEFAULT_EPOCHS = 50
QUICK_DEMO_EPOCHS = 5

# Generation Defaults
DEFAULT_GENERATE_NOTES = 150
DEFAULT_TEMPERATURE = 0.8
DEFAULT_TEMPO = 120
DEFAULT_INSTRUMENT = 0  # 0 = Acoustic Grand Piano (General MIDI)

# Audio / FluidSynth config
SOUNDFONT_PATH = BASE_DIR / "soundfonts" / "default.sf2"
FALLBACK_TO_BROWSER_AUDIO = True
