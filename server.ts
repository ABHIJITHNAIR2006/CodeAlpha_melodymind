import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pipelineState } from './src/server/pipelineState.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup multer for MIDI uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.mid' || ext === '.midi') {
      cb(null, true);
    } else {
      cb(new Error('Only .mid and .midi files are permitted.'));
    }
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'MelodyMind – AI Music Generator',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development'
  });
});

// Step 1: Collect MIDI Data
app.get('/api/files', (req, res) => {
  const files = pipelineState.getFiles();
  res.json({ files, count: files.length });
});

app.post('/api/download-sample-dataset', (req, res) => {
  const result = pipelineState.seedSampleDataset();
  const files = pipelineState.getFiles();
  res.json({ result, files });
});

app.post('/api/upload-midi', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No MIDI file uploaded.' });
    }

    const genre = (req.body.genre || 'Custom') as 'Classical' | 'Jazz' | 'Pop' | 'Folk' | 'Custom';
    const id = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + Date.now().toString(36);
    
    // Parse approximate notes from raw buffer or generate sequential tokens
    const sampleNotes = ["C4", "E4", "G4", "B4", "C5", "D5", "G4", "E4", "F4", "A4", "C5"];
    const tokenCount = Math.max(20, Math.floor(req.file.size / 30));
    const extractedTokens: string[] = [];
    for (let i = 0; i < tokenCount; i++) {
      extractedTokens.push(sampleNotes[i % sampleNotes.length]);
    }

    const record = pipelineState.addUploadedFile({
      id,
      filename: req.file.originalname,
      genre,
      duration: Math.round(tokenCount * 0.5),
      tracks: 1,
      notes_count: tokenCount,
      size_kb: Number((req.file.size / 1024).toFixed(2)),
      tokens: extractedTokens,
      description: `User uploaded ${genre} track`
    });

    res.json({ status: 'success', file: record });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

app.delete('/api/files/:id', (req, res) => {
  const deleted = pipelineState.deleteFile(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json({ status: 'success', message: `Deleted ${req.params.id}` });
});

// Step 2: Preprocess
app.post('/api/preprocess', (req, res) => {
  const { sequence_length = 100, transpose = true, include_chords = true, include_durations = false } = req.body;
  const result = pipelineState.startPreprocessing(sequence_length, transpose, include_chords, include_durations);
  res.json(result);
});

app.get('/api/preprocess/status', (req, res) => {
  res.json(pipelineState.getPreprocessStatus());
});

// Step 3: Model
app.post('/api/model/build', (req, res) => {
  const { sequence_length = 100, vocab_size = 64, ...params } = req.body;
  const meta = pipelineState.buildDefaultModelMeta(sequence_length, vocab_size, params);
  res.json({ status: 'built', model: meta });
});

app.get('/api/model/summary', (req, res) => {
  res.json(pipelineState.getModelSummary());
});

app.get('/api/model/gan-overview', (req, res) => {
  res.json({
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
  });
});

// Step 4: Training
app.post('/api/train/start', (req, res) => {
  const { epochs = 50, batch_size = 64, quick_demo = false, model_params } = req.body;
  const result = pipelineState.startTraining(epochs, batch_size, quick_demo, model_params);
  res.json(result);
});

app.post('/api/train/stop', (req, res) => {
  const result = pipelineState.stopTraining();
  res.json(result);
});

app.get('/api/train/status', (req, res) => {
  res.json(pipelineState.getTrainingStatus());
});

// Step 5: Generation
app.post('/api/generate', (req, res) => {
  const {
    num_notes = 150,
    temperature = 0.8,
    tempo = 120,
    instrument = 'Acoustic Grand Piano',
    custom_seed
  } = req.body;

  const result = pipelineState.generateMusic(num_notes, temperature, tempo, instrument, custom_seed);
  // Do not send binary buffer in JSON
  const { midiBuffer, ...cleanResult } = result;
  res.json(cleanResult);
});

app.post('/api/generate/variations', (req, res) => {
  const { num_notes = 80, tempo = 120, instrument = 'Acoustic Grand Piano' } = req.body;
  const variations = pipelineState.generateVariations(num_notes, tempo, instrument);
  const clean = variations.map(({ midiBuffer, ...rest }) => rest);
  res.json({ variations: clean });
});

app.get('/api/outputs', (req, res) => {
  res.json({ outputs: pipelineState.getOutputs() });
});

app.get('/api/outputs/:id/midi', (req, res) => {
  const buffer = pipelineState.getMidiBuffer(req.params.id);
  if (!buffer) {
    return res.status(404).json({ error: 'Generated MIDI file not found' });
  }

  res.setHeader('Content-Type', 'audio/midi');
  res.setHeader('Content-Disposition', `attachment; filename="melodymind_${req.params.id}.mid"`);
  res.send(buffer);
});

app.get('/api/outputs/:id/audio', (req, res) => {
  // Graceful response for audio download: indicates browser synthesizer handles playback
  res.json({
    status: 'info',
    message: 'Audio playback is rendered via Tone.js in-browser synthesizer. Standard MIDI (.mid) file is available for direct download and DAW import.',
    midiUrl: `/api/outputs/${req.params.id}/midi`
  });
});

// Mount Vite or static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MelodyMind server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
