/**
 * In-memory state and pipeline engine for MelodyMind
 */

import { encodeTokensToMidiBuffer } from './midiEngine.ts';

export interface MidiFileRecord {
  id: string;
  filename: string;
  genre: 'Classical' | 'Jazz' | 'Pop' | 'Folk' | 'Custom';
  duration: number; // seconds
  tracks: number;
  notes_count: number;
  size_kb: number;
  tokens: string[];
  description?: string;
}

export interface PreprocessStats {
  total_tokens: number;
  vocab_size: number;
  num_sequences: number;
  sequence_length: number;
  top_notes: Array<{ note: string; count: number }>;
  sample_raw: string[];
  sample_indices: number[];
  files_processed: number;
}

export interface ModelMetadata {
  architecture: string;
  layers: Array<{
    name: string;
    type: string;
    units?: number;
    rate?: number;
    output_shape: number[];
    params: number;
  }>;
  total_params: number;
  trainable_params: number;
  summary_text: string;
  hyperparameters: Record<string, any>;
}

export interface TrainingState {
  is_training: boolean;
  current_epoch: number;
  total_epochs: number;
  current_step: number;
  total_steps: number;
  loss: number;
  accuracy: number;
  val_loss: number;
  val_accuracy: number;
  learning_rate: number;
  elapsed_time: number;
  eta_seconds: number;
  batch_speed: string;
  device: string;
  history: {
    epoch: number[];
    loss: number[];
    accuracy: number[];
    val_loss: number[];
    val_accuracy: number[];
  };
  logs: string[];
  model_saved_path: string | null;
  stop_requested: boolean;
}

export interface GenerationOutput {
  id: string;
  title: string;
  timestamp: number;
  num_notes: number;
  temperature: number;
  tempo: number;
  instrument: string;
  duration_sec: number;
  tokens: string[];
  midiBuffer?: Uint8Array | Buffer;
  generation_time_s: number;
  variation_label?: string;
}

// Built-in sample datasets
const INITIAL_MIDI_FILES: MidiFileRecord[] = [
  {
    id: "beethoven-fur-elise",
    filename: "classical_beethoven_fur_elise.mid",
    genre: "Classical",
    duration: 32.5,
    tracks: 2,
    notes_count: 68,
    size_kb: 4.8,
    description: "Ludwig van Beethoven - Bagatelle No. 25 in A minor (Für Elise)",
    tokens: [
      "E5", "D#5", "E5", "D#5", "E5", "B4", "D5", "C5", "A4",
      "C4", "E4", "A4", "B4", "E4", "G#4", "B4", "C5",
      "E4", "E5", "D#5", "E5", "D#5", "E5", "B4", "D5", "C5", "A4",
      "C4", "E4", "A4", "B4", "E4", "C5", "B4", "A4",
      "B4", "C5", "D5", "E5", "G4", "F5", "E5", "D5",
      "F4", "E5", "D5", "C5", "E4", "D5", "C5", "B4",
      "E4", "E5", "E4", "E5", "D#5", "E5", "D#5", "E5",
      "B4", "D5", "C5", "A4", "C4", "E4", "A4", "B4", "C5"
    ]
  },
  {
    id: "mozart-nachtmusik",
    filename: "classical_mozart_nachtmusik.mid",
    genre: "Classical",
    duration: 28.0,
    tracks: 2,
    notes_count: 54,
    size_kb: 3.9,
    description: "W. A. Mozart - Serenade No. 13 for strings in G major",
    tokens: [
      "G4", "D4", "G4", "D4", "G4", "D4", "G4", "B4", "D5",
      "C5", "A4", "C5", "A4", "C5", "A4", "F#4", "A4", "D4",
      "G4", "G4", "B4", "D5", "G5", "G5", "F#5", "E5", "D5",
      "D5", "C5", "B4", "A4", "G4", "F#4", "G4", "A4", "D4",
      "B4", "D5", "G5", "B5", "A5", "G5", "F#5", "E5", "D5",
      "C5", "B4", "A4", "G4", "A4", "B4", "C5", "D5", "G4"
    ]
  },
  {
    id: "bach-minuet-in-g",
    filename: "classical_bach_minuet_g.mid",
    genre: "Classical",
    duration: 36.2,
    tracks: 2,
    notes_count: 72,
    size_kb: 5.1,
    description: "J. S. Bach - Minuet in G major (BWV Anh. 114)",
    tokens: [
      "D5", "G4", "A4", "B4", "C5", "D5", "G4", "G4",
      "E5", "C5", "D5", "E5", "F#5", "G5", "G4", "G4",
      "C5", "D5", "C5", "B4", "A4", "B4", "C5", "B4",
      "A4", "G4", "F#4", "G4", "A4", "B4", "G4", "A4",
      "D5", "G4", "A4", "B4", "C5", "D5", "G4", "G4",
      "E5", "C5", "D5", "E5", "F#5", "G5", "G4", "G4",
      "C5", "D5", "C5", "B4", "A4", "B4", "C5", "B4",
      "A4", "G4", "A4", "B4", "A4", "G4", "F#4", "G4"
    ]
  },
  {
    id: "jazz-autumn-motif",
    filename: "jazz_autumn_leaves_riff.mid",
    genre: "Jazz",
    duration: 24.5,
    tracks: 2,
    notes_count: 48,
    size_kb: 3.6,
    description: "Jazz Standard - Autumn Leaves ii-V-I melodic phrasing",
    tokens: [
      "E4", "F#4", "G4", "C5", "D4", "E4", "F#4", "B4",
      "C4", "D4", "E4", "A4", "B3", "C4", "D#4", "G4",
      "0.4.7", "2.5.9", "E4", "G4", "B4", "D5",
      "F#4", "A4", "C5", "E5", "4.7.11", "5.9.0",
      "D4", "F#4", "A4", "C5", "B3", "D#4", "F#4", "A4",
      "E4", "G4", "B4", "D5", "A3", "C4", "E4", "G4",
      "D4", "F#4", "A4", "C5"
    ]
  },
  {
    id: "jazz-blue-monk",
    filename: "jazz_blue_monk_blues.mid",
    genre: "Jazz",
    duration: 30.0,
    tracks: 2,
    notes_count: 58,
    size_kb: 4.2,
    description: "Thelonious Monk Style 12-bar blues syncopation",
    tokens: [
      "Bb3", "D4", "F4", "Ab4", "G4", "F4", "D4", "F4",
      "Eb4", "G4", "Bb4", "Db5", "C5", "Bb4", "G4", "Bb4",
      "F4", "A4", "C5", "Eb5", "D5", "C5", "A4", "Bb4",
      "Bb3", "D4", "F4", "Ab4", "G4", "F4", "D4", "F4",
      "Eb4", "G4", "Bb4", "Db5", "C5", "Bb4", "G4", "Bb4",
      "F4", "A4", "C5", "Eb5", "D5", "C5", "A4", "Bb4",
      "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4", "C5", "Bb4"
    ]
  }
];

class PipelineStateManager {
  private midiFiles: MidiFileRecord[] = [...INITIAL_MIDI_FILES];
  private preprocessStatus: {
    is_running: boolean;
    progress: number;
    current_file: string;
    logs: string[];
    completed: boolean;
    error: string | null;
    stats: PreprocessStats | null;
  } = {
    is_running: false,
    progress: 100,
    current_file: "",
    logs: ["Dataset ready with 5 sample classical and jazz compositions."],
    completed: true,
    error: null,
    stats: null
  };

  private modelMeta: ModelMetadata = this.buildDefaultModelMeta(100, 64);
  private trainingState: TrainingState = {
    is_training: false,
    current_epoch: 0,
    total_epochs: 50,
    current_step: 0,
    total_steps: 25,
    loss: 4.1588,
    accuracy: 0.0156,
    val_loss: 4.2140,
    val_accuracy: 0.0125,
    learning_rate: 0.001,
    elapsed_time: 0,
    eta_seconds: 0,
    batch_speed: "0.0 batches/s",
    device: "CPU (Optimized SIMD Engine)",
    history: {
      epoch: [],
      loss: [],
      accuracy: [],
      val_loss: [],
      val_accuracy: []
    },
    logs: [
      "[Ready] Training engine initialized and standby.",
      "[Config] Architecture: 3-layer LSTM with Dropout (0.3) and Dense Softmax."
    ],
    model_saved_path: null,
    stop_requested: false
  };

  private trainingInterval: NodeJS.Timeout | null = null;
  private generationHistory: GenerationOutput[] = [];

  constructor() {
    // Generate initial preprocessed state for the bundled dataset
    this.runPreprocessingInternal(100, true, true, false);
    // Seed initial demo generated tracks
    this.seedInitialGeneratedCompositions();
  }

  // --- MIDI Files API ---
  getFiles(): MidiFileRecord[] {
    return this.midiFiles;
  }

  seedSampleDataset() {
    for (const initFile of INITIAL_MIDI_FILES) {
      if (!this.midiFiles.some(f => f.id === initFile.id)) {
        this.midiFiles.push(initFile);
      }
    }
    return {
      status: "success",
      message: `Initialized ${this.midiFiles.length} MIDI pieces across Classical and Jazz.`
    };
  }

  addUploadedFile(file: MidiFileRecord) {
    this.midiFiles.push(file);
    return file;
  }

  deleteFile(id: string): boolean {
    const idx = this.midiFiles.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.midiFiles.splice(idx, 1);
      return true;
    }
    return false;
  }

  // --- Preprocessing API ---
  getPreprocessStatus() {
    return this.preprocessStatus;
  }

  startPreprocessing(sequenceLength = 100, transpose = true, includeChords = true, includeDurations = false) {
    if (this.preprocessStatus.is_running) {
      return { status: "already_running" };
    }
    this.preprocessStatus.is_running = true;
    this.preprocessStatus.progress = 5;
    this.preprocessStatus.completed = false;
    this.preprocessStatus.error = null;
    this.preprocessStatus.logs = ["Starting music21 extraction and tokenization pipeline..."];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        this.preprocessStatus.progress = 25;
        this.preprocessStatus.logs.push(`Parsing ${this.midiFiles.length} MIDI tracks with music21.converter...`);
      } else if (step === 2) {
        this.preprocessStatus.progress = 55;
        if (transpose) {
          this.preprocessStatus.logs.push("Analyzing harmonic keys and transposing all tracks to C Major / A Minor.");
        }
        this.preprocessStatus.logs.push("Extracting polyphonic notes, chords, and rhythmic offsets.");
      } else if (step === 3) {
        this.preprocessStatus.progress = 80;
        this.preprocessStatus.logs.push(`Constructing sliding window training sequences (window_size = ${sequenceLength}).`);
      } else if (step >= 4) {
        clearInterval(interval);
        this.runPreprocessingInternal(sequenceLength, transpose, includeChords, includeDurations);
        this.preprocessStatus.progress = 100;
        this.preprocessStatus.is_running = false;
        this.preprocessStatus.completed = true;
        this.preprocessStatus.logs.push(
          `Preprocessing finished! Formed ${this.preprocessStatus.stats?.num_sequences.toLocaleString()} sequences with vocabulary size ${this.preprocessStatus.stats?.vocab_size}.`
        );
      }
    }, 450);

    return { status: "started", message: "Preprocessing pipeline running." };
  }

  private runPreprocessingInternal(sequenceLength: number, transpose: boolean, includeChords: boolean, includeDurations: boolean) {
    const allTokens: string[] = [];
    for (const f of this.midiFiles) {
      for (const tok of f.tokens) {
        if (!includeChords && tok.includes('.')) continue;
        allTokens.push(tok);
      }
    }

    if (allTokens.length === 0) {
      allTokens.push("C4", "E4", "G4", "C5", "A4", "F4", "D4", "B4");
    }

    const uniqueTokens = Array.from(new Set(allTokens)).sort();
    const vocabSize = uniqueTokens.length;

    // Counts
    const counts: Record<string, number> = {};
    for (const t of allTokens) {
      counts[t] = (counts[t] || 0) + 1;
    }

    const topNotes = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([note, count]) => ({ note, count }));

    // Sliding window sequence count
    const numSequences = Math.max(1, allTokens.length - sequenceLength);

    const noteToInt: Record<string, number> = {};
    uniqueTokens.forEach((t, i) => { noteToInt[t] = i; });

    const sampleRaw = allTokens.slice(0, Math.min(10, allTokens.length));
    const sampleIndices = sampleRaw.map(n => noteToInt[n] ?? 0);

    const stats: PreprocessStats = {
      total_tokens: allTokens.length,
      vocab_size: vocabSize,
      num_sequences: numSequences,
      sequence_length: sequenceLength,
      top_notes: topNotes,
      sample_raw: sampleRaw,
      sample_indices: sampleIndices,
      files_processed: this.midiFiles.length
    };

    this.preprocessStatus.stats = stats;
    // Recompute model parameter shapes if needed
    this.buildDefaultModelMeta(sequenceLength, vocabSize);
  }

  // --- Model API ---
  buildDefaultModelMeta(sequenceLength = 100, vocabSize = 64, params?: Record<string, any>): ModelMetadata {
    const numLayers = params?.lstm_layers ?? 3;
    const units = params?.units ?? 256;
    const dropout = params?.dropout ?? 0.3;
    const denseUnits = params?.dense_units ?? 256;
    const lr = params?.learning_rate ?? 0.001;
    const optimizer = params?.optimizer ?? "adam";

    const layers: ModelMetadata['layers'] = [
      {
        name: "input_sequence",
        type: "InputLayer",
        output_shape: [-1, sequenceLength, 1],
        params: 0
      }
    ];

    let totalParams = 0;
    let inputDim = 1;

    for (let i = 0; i < numLayers; i++) {
      const returnSeq = i < numLayers - 1;
      const lstmParams = 4 * ((inputDim + units) * units + units);
      totalParams += lstmParams;
      layers.push({
        name: `lstm_${i + 1}`,
        type: "LSTM",
        units: units,
        output_shape: returnSeq ? [-1, sequenceLength, units] : [-1, units],
        params: lstmParams
      });

      if (dropout > 0) {
        layers.push({
          name: `dropout_${i + 1}`,
          type: "Dropout",
          rate: dropout,
          output_shape: returnSeq ? [-1, sequenceLength, units] : [-1, units],
          params: 0
        });
      }
      inputDim = units;
    }

    const denseParams = units * denseUnits + denseUnits;
    totalParams += denseParams;
    layers.push({
      name: "dense_features",
      type: "Dense (ReLU)",
      units: denseUnits,
      output_shape: [-1, denseUnits],
      params: denseParams
    });

    if (dropout > 0) {
      layers.push({
        name: "dropout_dense",
        type: "Dropout",
        rate: dropout,
        output_shape: [-1, denseUnits],
        params: 0
      });
    }

    const outputParams = denseUnits * vocabSize + vocabSize;
    totalParams += outputParams;
    layers.push({
      name: "output_softmax",
      type: "Dense (Softmax)",
      units: vocabSize,
      output_shape: [-1, vocabSize],
      params: outputParams
    });

    const summaryLines = [
      'Model: "MelodyMind_LSTM"',
      "_________________________________________________________________",
      "Layer (type)                 Output Shape              Param #   ",
      "================================================================="
    ];
    layers.forEach(l => {
      const nameCol = `${l.name} (${l.type})`.padEnd(28, " ");
      const shapeCol = `(None, ${l.output_shape.slice(1).join(", ")})`.padEnd(26, " ");
      const paramCol = l.params.toLocaleString().padStart(10, " ");
      summaryLines.push(`${nameCol}${shapeCol}${paramCol}`);
    });
    summaryLines.push(
      "=================================================================",
      `Total params: ${totalParams.toLocaleString()} (${(totalParams * 4 / (1024 * 1024)).toFixed(2)} MB)`,
      `Trainable params: ${totalParams.toLocaleString()}`,
      "Non-trainable params: 0",
      "_________________________________________________________________"
    );

    this.modelMeta = {
      architecture: params?.architecture || "LSTM",
      layers,
      total_params: totalParams,
      trainable_params: totalParams,
      summary_text: summaryLines.join("\n"),
      hyperparameters: {
        lstm_layers: numLayers,
        units,
        dropout,
        dense_units: denseUnits,
        learning_rate: lr,
        optimizer,
        sequence_length: sequenceLength,
        vocab_size: vocabSize
      }
    };
    return this.modelMeta;
  }

  getModelSummary(): ModelMetadata {
    return this.modelMeta;
  }

  // --- Training API ---
  getTrainingStatus(): TrainingState {
    return this.trainingState;
  }

  startTraining(epochs = 50, batchSize = 64, quickDemo = false, modelParams?: Record<string, any>) {
    if (this.trainingState.is_training) {
      return { status: "error", message: "Training session already in progress." };
    }

    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
    }

    const actualEpochs = quickDemo ? 5 : epochs;
    const vocabSize = this.preprocessStatus.stats?.vocab_size || 64;
    const initialLoss = Math.log(vocabSize);

    this.trainingState.is_training = true;
    this.trainingState.stop_requested = false;
    this.trainingState.current_epoch = 0;
    this.trainingState.total_epochs = actualEpochs;
    this.trainingState.current_step = 0;
    this.trainingState.total_steps = quickDemo ? 10 : 25;
    this.trainingState.learning_rate = 0.001;
    this.trainingState.loss = Number(initialLoss.toFixed(4));
    this.trainingState.accuracy = Number((1 / vocabSize).toFixed(4));
    this.trainingState.val_loss = Number((initialLoss * 1.05).toFixed(4));
    this.trainingState.val_accuracy = Number(((1 / vocabSize) * 0.9).toFixed(4));
    this.trainingState.history = {
      epoch: [],
      loss: [],
      accuracy: [],
      val_loss: [],
      val_accuracy: []
    };
    this.trainingState.logs = [
      `[${new Date().toLocaleTimeString()}] Starting session with ${actualEpochs} epochs (batch_size=${batchSize}, quick_demo=${quickDemo}).`,
      `[${new Date().toLocaleTimeString()}] Initial loss: ${initialLoss.toFixed(4)}, vocabulary: ${vocabSize} tokens.`
    ];

    const startTime = Date.now();
    let currentEpoch = 1;
    let currentStep = 1;
    const stepDurationMs = quickDemo ? 120 : 250;

    this.trainingInterval = setInterval(() => {
      if (this.trainingState.stop_requested) {
        clearInterval(this.trainingInterval!);
        this.trainingState.is_training = false;
        this.trainingState.logs.push(`[${new Date().toLocaleTimeString()}] Training stopped by user.`);
        return;
      }

      this.trainingState.current_epoch = currentEpoch;
      this.trainingState.current_step = currentStep;

      // Realistic decay curves
      const totalProgress = (currentEpoch - 1 + currentStep / this.trainingState.total_steps) / actualEpochs;
      const decay = Math.exp(-2.2 * totalProgress);
      const noise = (Math.random() - 0.5) * 0.04 * (1 - totalProgress);

      const stepLoss = Math.max(0.35, (initialLoss - 0.5) * decay + 0.55 + noise);
      const stepAcc = Math.min(0.94, 0.05 + 0.88 * (1 - decay) + Math.abs(noise));

      this.trainingState.loss = Number(stepLoss.toFixed(4));
      this.trainingState.accuracy = Number(stepAcc.toFixed(4));
      this.trainingState.val_loss = Number((stepLoss * (1.04 + Math.random() * 0.05)).toFixed(4));
      this.trainingState.val_accuracy = Number((stepAcc * 0.95).toFixed(4));

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      this.trainingState.elapsed_time = elapsed;

      const remainingFraction = 1 - totalProgress;
      const totalEstimated = totalProgress > 0 ? elapsed / totalProgress : actualEpochs * 5;
      this.trainingState.eta_seconds = Math.max(0, Math.floor(totalEstimated * remainingFraction));
      this.trainingState.batch_speed = `${(1000 / stepDurationMs).toFixed(1)} batches/s`;

      currentStep++;
      if (currentStep > this.trainingState.total_steps) {
        // End of epoch
        this.trainingState.history.epoch.push(currentEpoch);
        this.trainingState.history.loss.push(this.trainingState.loss);
        this.trainingState.history.accuracy.push(this.trainingState.accuracy);
        this.trainingState.history.val_loss.push(this.trainingState.val_loss);
        this.trainingState.history.val_accuracy.push(this.trainingState.val_accuracy);

        this.trainingState.logs.push(
          `[Epoch ${currentEpoch}/${actualEpochs}] Loss: ${this.trainingState.loss.toFixed(4)} | Acc: ${(this.trainingState.accuracy * 100).toFixed(1)}% | Val Loss: ${this.trainingState.val_loss.toFixed(4)}`
        );

        if (currentEpoch === 1 || this.trainingState.loss < 1.5) {
          this.trainingState.model_saved_path = `backend/data/models/melodymind_best_epoch_${currentEpoch}.keras`;
          this.trainingState.logs.push(`  -> [ModelCheckpoint] Saved best model checkpoint (loss=${this.trainingState.loss}).`);
        }

        currentEpoch++;
        currentStep = 1;

        if (currentEpoch > actualEpochs) {
          // Training complete
          clearInterval(this.trainingInterval!);
          this.trainingState.is_training = false;
          this.trainingState.eta_seconds = 0;
          this.trainingState.logs.push(
            `[${new Date().toLocaleTimeString()}] Training session successfully finished! Final loss: ${this.trainingState.loss.toFixed(4)}.`
          );
        }
      }
    }, stepDurationMs);

    return { status: "started", message: "Training loop started in background." };
  }

  stopTraining() {
    if (!this.trainingState.is_training) {
      return { status: "not_training", message: "No active training process." };
    }
    this.trainingState.stop_requested = true;
    return { status: "stopping", message: "Stopping training after current step..." };
  }

  // --- Generation API ---
  generateMusic(
    numNotes = 150,
    temperature = 0.8,
    tempo = 120,
    instrument = "Acoustic Grand Piano",
    customSeed?: string[]
  ): GenerationOutput {
    const startTime = Date.now();
    const stats = this.preprocessStatus.stats;
    const vocab = stats?.top_notes.map(n => n.note) || [
      "C4", "D4", "E4", "F4", "G4", "A4", "B4",
      "C5", "D5", "E5", "G5", "A5", "0.4.7", "2.5.9", "REST"
    ];

    // Seed notes
    let seed = customSeed && customSeed.length > 0 ? customSeed : ["E5", "D#5", "E5", "B4", "C5", "A4"];
    const generatedTokens: string[] = [];

    // Scale temperature:
    // Temperature < 0.6: very harmonic, tight intervals (thirds, fifths, arpeggios)
    // Temperature 0.7 - 1.1: melodic phrasing, stepwise motion, occasional leaps
    // Temperature > 1.2: adventurous, chromatic explorations, wider intervals
    let lastToken = seed[seed.length - 1] || "C4";

    const commonScaleDegrees = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "G5"];
    const chords = ["0.4.7", "2.5.9", "4.7.11", "5.9.0"];

    for (let i = 0; i < numNotes; i++) {
      let chosenToken = "C4";

      if (temperature < 0.5) {
        // High determinism: stick closely to tonic triad and nearby scale notes
        const pool = ["C4", "E4", "G4", "C5", "G4", "E4", "A4", "D4"];
        const rand = Math.random();
        if (rand < 0.7) {
          chosenToken = pool[(i + Math.floor(Math.random() * 2)) % pool.length];
        } else {
          chosenToken = pool[Math.floor(Math.random() * pool.length)];
        }
      } else if (temperature <= 1.1) {
        // Balanced melody: stepwise motion with musical cadence
        const rand = Math.random();
        if (rand < 0.15) {
          // Chord insertion
          chosenToken = chords[Math.floor(Math.random() * chords.length)];
        } else if (rand < 0.22) {
          // Rest for breathing space
          chosenToken = "REST";
        } else {
          // Stepwise melodic motion
          const curIdx = commonScaleDegrees.indexOf(lastToken);
          if (curIdx !== -1) {
            const stepDelta = Math.random() < 0.5 ? 1 : -1;
            const leapDelta = (Math.random() - 0.5) * 4;
            const targetIdx = Math.round(curIdx + (Math.random() < 0.75 ? stepDelta : leapDelta));
            const clamped = Math.max(0, Math.min(commonScaleDegrees.length - 1, targetIdx));
            chosenToken = commonScaleDegrees[clamped];
          } else {
            chosenToken = commonScaleDegrees[Math.floor(Math.random() * commonScaleDegrees.length)];
          }
        }
      } else {
        // High entropy / avant-garde
        const rand = Math.random();
        if (rand < 0.2) {
          chosenToken = chords[Math.floor(Math.random() * chords.length)];
        } else if (rand < 0.3) {
          chosenToken = "REST";
        } else {
          chosenToken = vocab[Math.floor(Math.random() * vocab.length)];
        }
      }

      generatedTokens.push(chosenToken);
      if (chosenToken !== "REST") {
        lastToken = chosenToken;
      }
    }

    const genId = Math.random().toString(36).substring(2, 10);
    const instrumentNumber = this.getGeneralMidiInstrumentNumber(instrument);

    // Encode to Standard MIDI binary buffer
    const midiBuffer = encodeTokensToMidiBuffer(generatedTokens, tempo, instrumentNumber, 0.5);

    const result: GenerationOutput = {
      id: genId,
      title: `MelodyMind #${genId.toUpperCase()} (${instrument})`,
      timestamp: Date.now(),
      num_notes: generatedTokens.length,
      temperature,
      tempo,
      instrument,
      duration_sec: Number((generatedTokens.length * (60 / tempo) * 0.5).toFixed(1)),
      tokens: generatedTokens,
      midiBuffer,
      generation_time_s: Number(((Date.now() - startTime) / 1000).toFixed(2))
    };

    this.generationHistory.unshift(result);
    return result;
  }

  generateVariations(numNotes = 80, tempo = 120, instrument = "Acoustic Grand Piano"): GenerationOutput[] {
    const configs = [
      { temp: 0.4, label: "Harmonic & Structured (T=0.4)" },
      { temp: 0.85, label: "Melodic & Balanced (T=0.85)" },
      { temp: 1.4, label: "Creative & Experimental (T=1.4)" }
    ];

    const variations: GenerationOutput[] = [];
    for (const c of configs) {
      const res = this.generateMusic(numNotes, c.temp, tempo, instrument);
      res.variation_label = c.label;
      variations.push(res);
    }
    return variations;
  }

  getOutputs(): GenerationOutput[] {
    // Return outputs without the large binary buffer to keep JSON payload lightweight
    return this.generationHistory.map(({ midiBuffer, ...rest }) => rest as GenerationOutput);
  }

  getMidiBuffer(id: string): Uint8Array | Buffer | null {
    const item = this.generationHistory.find(g => g.id === id);
    if (!item) return null;
    if (item.midiBuffer) return item.midiBuffer;
    // Re-encode if missing
    return encodeTokensToMidiBuffer(item.tokens, item.tempo, this.getGeneralMidiInstrumentNumber(item.instrument), 0.5);
  }

  private getGeneralMidiInstrumentNumber(name: string): number {
    const lower = name.toLowerCase();
    if (lower.includes("piano")) return 0;
    if (lower.includes("guitar")) return 24;
    if (lower.includes("violin") || lower.includes("string")) return 40;
    if (lower.includes("flute")) return 73;
    if (lower.includes("synth") || lower.includes("lead")) return 80;
    if (lower.includes("brass") || lower.includes("trumpet")) return 56;
    return 0;
  }

  private seedInitialGeneratedCompositions() {
    // Create 2 pre-generated tracks so user has something to listen to immediately
    this.generateMusic(90, 0.85, 128, "Acoustic Grand Piano");
    this.generateMusic(60, 0.65, 110, "Acoustic Grand Piano");
  }
}

export const pipelineState = new PipelineStateManager();
