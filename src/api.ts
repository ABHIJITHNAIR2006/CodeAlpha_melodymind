/**
 * MelodyMind API Client
 */

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
    const res = await fetch('/api/files');
    if (!res.ok) throw new Error('Failed to fetch MIDI files');
    return res.json();
  },

  async downloadSampleDataset(): Promise<{ result: any; files: MidiFile[] }> {
    const res = await fetch('/api/download-sample-dataset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to download sample dataset');
    return res.json();
  },

  async uploadMidi(file: File, genre: string): Promise<{ status: string; file: MidiFile }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('genre', genre);
    const res = await fetch('/api/upload-midi', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload MIDI file');
    }
    return res.json();
  },

  async deleteFile(id: string): Promise<void> {
    const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete MIDI file');
  },

  // Step 2: Preprocess
  async startPreprocess(params: {
    sequence_length: number;
    transpose: boolean;
    include_chords: boolean;
    include_durations?: boolean;
  }): Promise<any> {
    const res = await fetch('/api/preprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to start preprocessing');
    return res.json();
  },

  async getPreprocessStatus(): Promise<PreprocessStatusResponse> {
    const res = await fetch('/api/preprocess/status');
    if (!res.ok) throw new Error('Failed to get preprocessing status');
    return res.json();
  },

  // Step 3: Model
  async buildModel(params: Record<string, any>): Promise<{ status: string; model: ModelSummaryResponse }> {
    const res = await fetch('/api/model/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to build model');
    return res.json();
  },

  async getModelSummary(): Promise<ModelSummaryResponse> {
    const res = await fetch('/api/model/summary');
    if (!res.ok) throw new Error('Failed to get model summary');
    return res.json();
  },

  async getGanOverview(): Promise<any> {
    const res = await fetch('/api/model/gan-overview');
    if (!res.ok) throw new Error('Failed to get GAN overview');
    return res.json();
  },

  // Step 4: Training
  async startTraining(params: {
    epochs: number;
    batch_size: number;
    quick_demo: boolean;
    model_params?: Record<string, any>;
  }): Promise<any> {
    const res = await fetch('/api/train/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to start training');
    return res.json();
  },

  async stopTraining(): Promise<any> {
    const res = await fetch('/api/train/stop', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop training');
    return res.json();
  },

  async getTrainingStatus(): Promise<TrainingStatusResponse> {
    const res = await fetch('/api/train/status');
    if (!res.ok) throw new Error('Failed to fetch training status');
    return res.json();
  },

  // Step 5: Generation
  async generateMusic(params: {
    num_notes: number;
    temperature: number;
    tempo: number;
    instrument: string;
    custom_seed?: string[];
  }): Promise<GenerationItem> {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to generate music');
    return res.json();
  },

  async generateVariations(params: {
    num_notes: number;
    tempo: number;
    instrument: string;
  }): Promise<{ variations: GenerationItem[] }> {
    const res = await fetch('/api/generate/variations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to generate variations');
    return res.json();
  },

  async getOutputs(): Promise<{ outputs: GenerationItem[] }> {
    const res = await fetch('/api/outputs');
    if (!res.ok) throw new Error('Failed to fetch generated tracks');
    return res.json();
  },

  getMidiDownloadUrl(id: string): string {
    return `/api/outputs/${id}/midi`;
  }
};
