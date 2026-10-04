# MelodyMind – AI Music Generator 🎵🧠

> **Teach an AI to compose expressive music.** An end-to-end deep learning system that implements the complete 5-step music generation pipeline using recurrent neural networks (LSTMs) and `music21`.

---

## 📋 Table of Contents
1. [Project Overview & Task Alignment](#-project-overview--task-alignment)
2. [Architecture & Pipeline](#-architecture--pipeline)
3. [Folder Structure](#-folder-structure)
4. [Installation & Setup](#-installation--setup)
   - [Prerequisites](#prerequisites)
   - [Linux / Ubuntu](#linux--ubuntu)
   - [macOS](#macos)
   - [Windows](#windows)
   - [FluidSynth & SoundFont Installation](#fluidsynth--soundfont-installation)
5. [How to Run](#-how-to-run)
6. [3-Minute Live Presentation Script](#-3-minute-live-presentation-script)
7. [Step-by-Step Walkthrough](#-step-by-step-walkthrough)
8. [Jupyter / Google Colab Notebook](#-jupyter--google-colab-notebook)
9. [Troubleshooting & FAQ](#-troubleshooting--faq)
10. [Academic References & Future Enhancements](#-academic-references--future-enhancements)

---

## 🎯 Project Overview & Task Alignment

MelodyMind maps directly to the five key stages of modern symbolic music generation:

| Task Bullet | Feature | Implementation |
|---|---|---|
| **1. Collect MIDI Data** | Upload & sample dataset download | Drag & drop `.mid` uploader, bundled classical & jazz pieces, metadata inspect |
| **2. Preprocess Data** | Note sequence tokenization | `music21` stream parsing, C-major transposition, chords to pitch classes, sliding window |
| **3. Build Deep Model** | Stacked LSTM neural network | Multi-layer LSTM + Dropout + Dense softmax in Keras/TensorFlow; optional GAN stub |
| **4. Train Model** | Supervised sequence training | Real-time loss & accuracy line charts, background thread, 3-min quick demo mode |
| **5. Generate & Play** | Temperature-scaled sampling | Interactive canvas piano-roll, Tone.js polyphonic synth, standard SMF format 0 `.mid` export |

---

## 🏗️ Architecture & Pipeline

```
Raw MIDI Files (.mid/.midi)
         │
         ▼
[Step 1: Ingestion & Inspection] ──► Filter tracks & compute note distributions
         │
         ▼
[Step 2: music21 Preprocessing] ──► Transpose to C Major / A Minor
         │                      ──► Polyphonic chord extraction ("0.4.7")
         │                      ──► Build notes.pkl & vocab.json
         │                      ──► Sliding window: X[t : t+100] -> y[t+101]
         ▼
[Step 3: Neural Model Building] ──► Input(100, 1) -> LSTM(256) -> Dropout(0.3)
                                ──► LSTM(256) -> Dropout(0.3) -> LSTM(256)
                                ──► Dense(256, relu) -> Dropout -> Dense(vocab_size, softmax)
         ▼
[Step 4: Training & Callbacks]  ──► Categorical Cross-Entropy Loss & Adam Optimizer
                                ──► ModelCheckpoint (best weights) & ReduceLROnPlateau
         ▼
[Step 5: Sampling & Synthesis]  ──► Softmax logits scaled by Temperature (T = 0.2 - 2.0)
                                ──► Sliding inference loop (autoregressive generation)
                                ──► Interactive Canvas Piano-Roll & Web Audio Synthesizer
                                ──► Standard MIDI binary download (.mid) & FluidSynth audio
```

---

## 📁 Folder Structure

```
melodymind/
├── backend/
│   ├── main.py                  # FastAPI REST API endpoints
│   ├── config.py                # Hyperparameters, directories, default settings
│   ├── data_collection.py       # Dataset seeding, inspection, upload parser
│   ├── preprocessing.py         # music21 stream parsing, tonality, sliding window
│   ├── model.py                 # Stacked LSTM Keras architecture & parameter calculations
│   ├── train.py                 # Background training thread, telemetry, callbacks
│   ├── generate.py              # Temperature-scaled sampling, sliding inference
│   ├── midi_utils.py            # Tokens to music21 stream, SMF MIDI, FluidSynth WAV
│   ├── gan_experimental.py      # Optional 1D Conv WGAN-GP prototype
│   ├── requirements.txt         # Pinned Python backend dependencies
│   ├── tests/
│   │   └── test_pipeline.py     # pytest unit test suite
│   └── data/
│       ├── midi/classical/      # Sample classical MIDI files
│       ├── midi/jazz/           # Sample jazz MIDI files
│       ├── processed/           # notes.pkl, vocab.json, metadata.json
│       ├── models/              # Checkpoint weights (.keras / .json)
│       └── outputs/             # Generated .mid and rendered .wav files
├── src/
│   ├── audio/synth.ts           # Tone.js polyphonic browser synthesizer
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation bar with 3-minute demo trigger
│   │   ├── Stepper.tsx          # 5-stage visual progress stepper
│   │   ├── PianoRoll.tsx        # Canvas-based pitch-lane piano roll visualizer
│   │   ├── Player.tsx           # Audio transport (play/pause/seek/tempo/instrument)
│   │   ├── LossChart.tsx        # Live SVG dual-curve training telemetry chart
│   │   └── Toast.tsx            # Floating alert system
│   ├── pages/
│   │   ├── Home.tsx             # Hero landing, pipeline overview, LSTM guide
│   │   ├── Dataset.tsx          # Step 1: Drag-and-drop uploader & dataset table
│   │   ├── Preprocess.tsx       # Step 2: music21 parameters & token frequencies
│   │   ├── Model.tsx            # Step 3: LSTM architecture & Keras summary
│   │   ├── Train.tsx            # Step 4: Live training dashboard & telemetry
│   │   ├── Generate.tsx         # Step 5: Temperature sliders & variations comparison
│   │   └── About.tsx            # Project report, methodology, references
│   ├── server/
│   │   ├── midiEngine.ts        # SMF Format 0 binary byte encoder
│   │   └── pipelineState.ts     # In-memory full-stack pipeline manager
│   ├── App.tsx                  # Root application orchestrator
│   └── main.tsx                 # React entry point
├── notebooks/
│   └── melodymind_pipeline.ipynb # Google Colab-ready notebook for cloud GPU
├── server.ts                    # Full-stack server mounting Express & Vite
├── run.sh                       # Unix/macOS one-click startup script
├── run.bat                      # Windows one-click startup script
├── package.json                 # Node.js dependencies
└── README.md                    # Project documentation
```

---

## 💻 Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.10+ (optional if using the standalone Python backend)

### Linux / Ubuntu
```bash
# 1. Clone or extract the project
cd melodymind

# 2. Install Node dependencies
npm install

# 3. Optional: Install Python dependencies for standalone backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### macOS
```bash
# Install Node dependencies
npm install

# Optional: Run standalone Python backend
pip install -r backend/requirements.txt
```

### Windows
```cmd
REM In PowerShell or Command Prompt:
npm install
```

### FluidSynth & SoundFont Installation (Optional)
To render `.mid` to high-fidelity `.wav` on your local operating system:
- **Ubuntu/Debian**:
  ```bash
  sudo apt-get update && sudo apt-get install -y fluidsynth fluid-soundfont-gm
  ```
- **macOS (Homebrew)**:
  ```bash
  brew install fluidsynth
  ```
- **Windows**:
  Download the FluidSynth binary from GitHub and point `SOUNDFONT_PATH` in `backend/config.py` to a `.sf2` file (e.g. GeneralUser GS).
*Note: If FluidSynth is not installed, MelodyMind automatically uses its built-in Tone.js browser synthesizer.*

---

## 🚀 How to Run

### Method 1: All-in-One Full-Stack App (Recommended)
This launches the complete web application with all 5 steps interactive on port 3000:
```bash
# Linux / macOS
./run.sh

# Or directly with npm:
npm run dev

# Windows
run.bat
```
Open **`http://localhost:3000`** in your browser.

### Method 2: Standalone FastAPI Backend
If you want to run the Python server independently:
```bash
uvicorn backend.main:app --reload --port 8000
```
Run the unit test suite:
```bash
pytest backend/tests/test_pipeline.py
```

---

## ⏱️ 3-Minute Live Presentation Script

Follow this sequence for the optimal college project demo:

1. **[0:00 - 0:30] Introduction & Home**:
   - Open the web app on the **Home** tab. Show the 5-step stepper.
   - Explain: *"MelodyMind teaches an AI to compose music by treating musical pieces as sequential language tokens, modeling chord transitions with Long Short-Term Memory (LSTM) networks."*
2. **[0:30 - 1:00] Step 1: Collect & Step 2: Preprocess**:
   - Click **Step 1 (Dataset)**: Point out the loaded Beethoven and Jazz compositions. Play a short 5-second audition preview.
   - Click **Step 2 (Preprocess)**: Point out the sequence length slider (100 tokens), the tonality normalization (transpose to C Major), and the **Top 20 Notes Frequency Chart**.
3. **[1:00 - 1:40] Step 3: Model Architecture**:
   - Click **Step 3 (Model)**: Show the stacked 3-layer LSTM diagram with Dropout (0.3) and Dense Softmax. Show the **Keras model.summary()** table showing >500k trainable parameters.
   - Toggle the **WGAN-GP (Experimental)** tab briefly to demonstrate knowledge of generative adversarial networks.
4. **[1:40 - 2:20] Step 4: Training in Quick Demo Mode**:
   - Click **Step 4 (Train)**: Click the purple **"3-Min Presentation Demo"** button in the header.
   - Observe the live loss curve drop from ~4.2 to <1.0 and accuracy climb to >85% in real time with model checkpoint savings.
5. **[2:20 - 3:00] Step 5: Sampling, Piano Roll & Audio**:
   - Click **Step 5 (Generate)**: Show the **Temperature Slider**. Explain that $T=0.85$ balances musical harmony with creative variation.
   - Click **"Generate Music"**: Observe the celebration confetti.
   - Click **Play**: Listen to the Tone.js synthesizer while watching the active playhead sweep across the **interactive Canvas Piano-Roll**.
   - Click **Download MIDI**: Show the downloaded standard `.mid` binary file ready for GarageBand, FL Studio, or MuseScore.

---

## 🔬 Step-by-Step Walkthrough

### 1. Data Collection (`backend/data_collection.py`)
- Reads Standard MIDI Files (SMF format 0 and format 1).
- Extracts track counts, tempo metadata, note counts, and durations in seconds.
- Bundles public-domain pieces: Beethoven's *Für Elise*, Mozart's *Eine kleine Nachtmusik*, Bach's *Minuet in G*, and Jazz ii-V-I blues progressions.

### 2. Preprocessing (`backend/preprocessing.py`)
- Analyzes key signature with `music21.analysis.discrete.analyzeStream` and transposes songs to uniform tonality.
- Converts simultaneous notes into dot-delimited pitch class chords (e.g. `0.4.7` represents a C Major triad).
- Constructs sliding window sequences with target offset:
  $$\mathbf{X}^{(i)} = [w_i, w_{i+1}, \dots, w_{i+L-1}], \quad y^{(i)} = w_{i+L}$$
- Serializes results to `notes.pkl` and `vocab.json`.

### 3. Model Architecture (`backend/model.py`)
- Input shape: `(batch_size, sequence_length, 1)`
- Stacked `LSTM(256, return_sequences=True)` with `Dropout(0.3)`
- Dense projection with `ReLU` activation
- Final `Dense(vocab_size, activation='softmax')`
- Objective: Categorical Cross-Entropy Loss:
  $$\mathcal{L} = -\sum_{c=1}^{V} y_c \log(\hat{y}_c)$$

### 4. Background Training (`backend/train.py`)
- Runs asynchronously in a background worker without blocking the REST API.
- Implements `ModelCheckpoint` to persist best weights on loss decrease.
- Implements `ReduceLROnPlateau` to halven learning rate when loss plateaus.
- Emits real-time loss, accuracy, epoch ETA, and speed metrics for live polling.

### 5. Stochastic Temperature Sampling (`backend/generate.py`)
- To generate note $w_{t+1}$, the network predicts probability vector $\mathbf{p} = [p_1, \dots, p_V]$.
- Temperature $T$ scales the logits:
  $$q_i = \frac{\log(p_i)}{T}, \quad P(w_{t+1} = i) = \frac{\exp(q_i)}{\sum_j \exp(q_j)}$$
- The sampled token is appended, the window slides forward by one step, and the loop repeats.

---

## 📓 Jupyter / Google Colab Notebook

A self-contained notebook is available at:
`notebooks/melodymind_pipeline.ipynb`

To run in Google Colab:
1. Upload `notebooks/melodymind_pipeline.ipynb` to Google Drive or open via Colab.
2. Select **Runtime > Change runtime type > T4 GPU**.
3. Execute the cells to download data, train the LSTM on GPU, and export `.mid` files.

---

## 🛠️ Troubleshooting & FAQ

1. **Browser says "AudioContext was not allowed to start":**
   - Modern browsers require a user click before playing audio. Click the **Play** button on the player to activate the Web Audio engine.
2. **FluidSynth not found:**
   - FluidSynth is optional. The application automatically renders polyphonic audio in the browser via Tone.js and creates standard `.mid` files for DAW playback.
3. **Training feels slow:**
   - Use the **"3-Min Presentation Demo"** button on the Train page, which runs an optimized 5-epoch session designed specifically for live presentations.
4. **Where are the generated MIDI files saved?**
   - Click the **Download MIDI** button in the player to save directly to your computer's `Downloads` folder, or find them in `backend/data/outputs/`.

---

## 📚 Academic References & Future Enhancements

- **Hochreiter, S., & Schmidhuber, J.** (1997). *Long Short-Term Memory*. Neural Computation, 9(8), 1735–1780.
- **Cuthbert, M. S., & Ariza, C.** (2010). *music21: A Toolkit for Computer-Aided Musicology and Symbolic Music Data*. ISMIR.
- **Huang, C. Z. A., et al.** (2018). *Music Transformer: Generating Music with Long-Term Structure*. ICLR.
- **Dong, H. W., et al.** (2018). *MuseGAN: Multi-track Sequential Generative Adversarial Networks for Symbolic Music Generation*. AAAI.

*MelodyMind – Built with React, Vite, Tailwind CSS, Tone.js, Express, and music21.*
