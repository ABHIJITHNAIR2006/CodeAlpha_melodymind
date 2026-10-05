/**
 * MelodyMind API Client with Vercel Serverless & In-Browser Resilience.
 * Communicates with /api/* when available, and falls back gracefully to in-memory
 * execution if deployed on a static edge host without serverless functions.
 */

import { pipelineState } from './server/pipelineState.ts';
import { triggerBrowserMidiDownload } from './server/midiEngine.ts';

export interface MidiFile {
  id: string;
  filename: string;
  genre: 'Classical' | 'Jazz' | 'Pop' | 'Folk' | 'Custom';
  duration: number;
  tracks: number;
  notes_count: number;
  size_kb: number;
  description?: string;
  tokens: string[];
}

export interface PreprocessStatusResponse {
  is_running: boolean;
  progress: number;
  current_file: string;
  logs: string[];
  completed: boolean;
  error: string | null;
  stats: {
    total_tokens: number;
    vocab_size: number;
    num_sequences: number;
    sequence_length: number;
    top_notes: Array<{ note: string; count: number }>;
    sample_raw: string[];
    sample_indices: number[];
    files_processed: number;
  } | null;
}

export interface ModelSummaryResponse {
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

export interface TrainingStatusResponse {
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

export interface GenerationItem {
  id: string;
  title: string;
  timestamp: number;
  num_notes: number;
  temperature: number;
  tempo: number;
  instrument: string;
  duration_sec: number;
  tokens: string[];
  generation_time_s: number;
  variation_label?: string;
}

export const api = {
  // Step 1: Collect
  async getFiles(): Promise<{ files: MidiFile[]; count: number }> {
    try {
      const res = await fetch('/api/files');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const files = pipelineState.getFiles() as MidiFile[];
    return { files, count: files.length };
  },

  async downloadSampleDataset(): Promise<{ result: any; files: MidiFile[] }> {
    try {
      const res = await fetch('/api/download-sample-dataset', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const result = pipelineState.seedSampleDataset();
    const files = pipelineState.getFiles() as MidiFile[];
    return { result, files };
  },

  async uploadMidi(file: File, genre: string): Promise<{ status: string; file: MidiFile }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('genre', genre);
      const res = await fetch('/api/upload-midi', {
        method: 'POST',
        body: formData
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }

    const id = file.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + Date.now().toString(36);
    const sampleNotes = ["C4", "E4", "G4", "B4", "C5", "D5", "G4", "E4", "F4", "A4", "C5"];
    const tokenCount = Math.max(20, Math.floor(file.size / 30));
    const extractedTokens: string[] = [];
    for (let i = 0; i < tokenCount; i++) {
      extractedTokens.push(sampleNotes[i % sampleNotes.length]);
    }

    const record = pipelineState.addUploadedFile({
      id,
      filename: file.name,
      genre: genre as any,
      duration: Math.round(tokenCount * 0.5),
      tracks: 1,
      notes_count: tokenCount,
      size_kb: Number((file.size / 1024).toFixed(2)),
      tokens: extractedTokens,
      description: `User uploaded ${genre} track`
    });

    return { status: 'success', file: record as MidiFile };
  },

  async deleteFile(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) return;
    } catch (e) {
      // Fallback
    }
    pipelineState.deleteFile(id);
  },

  // Step 2: Preprocess
  async startPreprocess(params: {
    sequence_length: number;
    transpose: boolean;
    include_chords: boolean;
    include_durations?: boolean;
  }): Promise<any> {
    try {
      const res = await fetch('/api/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return pipelineState.startPreprocessing(
      params.sequence_length,
      params.transpose,
      params.include_chords,
      params.include_durations
    );
  },

  async getPreprocessStatus(): Promise<PreprocessStatusResponse> {
    try {
      const res = await fetch('/api/preprocess/status');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return pipelineState.getPreprocessStatus();
  },

  // Step 3: Model
  async buildModel(params: Record<string, any>): Promise<{ status: string; model: ModelSummaryResponse }> {
    try {
      const res = await fetch('/api/model/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const meta = pipelineState.buildDefaultModelMeta(params.sequence_length || 100, params.vocab_size || 64, params);
    return { status: 'built', model: meta };
  },

  async getModelSummary(): Promise<ModelSummaryResponse> {
    try {
      const res = await fetch('/api/model/summary');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return pipelineState.getModelSummary();
  },

  async getGanOverview(): Promise<any> {
    try {
      const res = await fetch('/api/model/gan-overview');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return {
      architecture: 'WGAN-GP (Wasserstein GAN with Gradient Penalty)',
      status: 'Experimental Prototype',
      description: 'Generative Adversarial Network that samples full polyphonic musical sequences in parallel using 1D convolutional generators and bidirectional recurrent critics.',
      pros: [
        'Parallel sequence synthesis (O(1) inference vs autoregressive token loop)',
        'Smooth musical latent interpolation for style blending',
        'Capable of modeling polyphonic textures and layered accompaniment'
      ],
      challenges: [
        'Risk of mode collapse without Wasserstein gradient penalty',
        'Discrete token sampling non-differentiability',
        'High GPU memory consumption compared to sequential LSTMs'
      ],
      recommendation: 'Use LSTM for melodic coherence and phrase structure; test GAN for experimental polyphonic rhythms.'
    };
  },

  // Step 4: Training
  async startTraining(params: {
    epochs: number;
    batch_size: number;
    quick_demo: boolean;
    model_params?: Record<string, any>;
  }): Promise<any> {
    try {
      const res = await fetch('/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return pipelineState.startTraining(params.epochs, params.batch_size, params.quick_demo, params.model_params);
  },

  async stopTraining(): Promise<any> {
    try {
      const res = await fetch('/api/train/stop', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return pipelineState.stopTraining();
  },

  async getTrainingStatus(): Promise<TrainingStatusResponse> {
    try {
      const res = await fetch('/api/train/status');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return pipelineState.getTrainingStatus();
  },

  // Step 5: Generation
  async generateMusic(params: {
    num_notes: number;
    temperature: number;
    tempo: number;
    instrument: string;
    custom_seed?: string[];
  }): Promise<GenerationItem> {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const result = pipelineState.generateMusic(
      params.num_notes,
      params.temperature,
      params.tempo,
      params.instrument,
      params.custom_seed
    );
    const { midiBuffer, ...cleanResult } = result;
    return cleanResult;
  },

  async generateVariations(params: {
    num_notes: number;
    tempo: number;
    instrument: string;
  }): Promise<{ variations: GenerationItem[] }> {
    try {
      const res = await fetch('/api/generate/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const variations = pipelineState.generateVariations(params.num_notes, params.tempo, params.instrument);
    const clean = variations.map(({ midiBuffer, ...rest }) => rest);
    return { variations: clean };
  },

  async getOutputs(): Promise<{ outputs: GenerationItem[] }> {
    try {
      const res = await fetch('/api/outputs');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return { outputs: pipelineState.getOutputs() };
  },

  getMidiDownloadUrl(id: string): string {
    return `/api/outputs/${id}/midi`;
  },

  downloadMidiDirect(id: string, tokens: string[], tempo: number, instrument: string) {
    triggerBrowserMidiDownload(tokens, `melodymind_${id}.mid`, tempo, instrument);
  }
};
