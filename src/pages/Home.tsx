import React from 'react';
import { 
  Music, 
  Sparkles, 
  ArrowRight, 
  Database, 
  Layers, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  Disc,
  Play,
  Brain,
  Sliders,
  Terminal
} from 'lucide-react';
import { PipelineStepId } from '../components/Navbar';
import { StepStatus } from '../components/Stepper';

interface HomeProps {
  onNavigate: (step: PipelineStepId) => void;
  status: StepStatus;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, status }) => {
  const steps = [
    {
      id: 'dataset' as PipelineStepId,
      num: '01',
      title: 'Collect MIDI Data',
      tagline: 'Dataset Ingestion & Inspection',
      desc: 'Upload multi-track MIDI files or download bundled classical & jazz collections. Inspect note counts, durations, and musical scales.',
      icon: Database,
      isDone: status.hasFiles,
      badge: 'Step 1'
    },
    {
      id: 'preprocess' as PipelineStepId,
      num: '02',
      title: 'Preprocess Sequences',
      tagline: 'music21 Parsing & Tokenization',
      desc: 'Flatten streams, normalize tonality to C Major / A Minor, encode polyphonic chords, and build sliding window sequence tensors.',
      icon: Layers,
      isDone: status.hasPreprocessed,
      badge: 'Step 2'
    },
    {
      id: 'model' as PipelineStepId,
      num: '03',
      title: 'Build Neural Network',
      tagline: 'Deep Stacked LSTM Architecture',
      desc: 'Configure 1-3 layer recurrent LSTMs with Dropout regularization, dense projection, and softmax probability distributions.',
      icon: Cpu,
      isDone: status.hasModel,
      badge: 'Step 3'
    },
    {
      id: 'train' as PipelineStepId,
      num: '04',
      title: 'Train on Dataset',
      tagline: 'Live Optimization & Telemetry',
      desc: 'Watch real-time categorical cross-entropy loss convergence and accuracy graphs. Includes 3-minute presentation demo mode.',
      icon: Activity,
      isDone: status.hasTrained,
      badge: 'Step 4'
    },
    {
      id: 'generate' as PipelineStepId,
      num: '05',
      title: 'Generate & Play',
      tagline: 'Temperature-Scaled Sampling',
      desc: 'Sample novel sequences, visualize on the interactive canvas piano-roll, synthesize in-browser with Tone.js, and export standard MIDI.',
      icon: Sparkles,
      isDone: false,
      badge: 'Step 5'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20">
        
        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-blue-600/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10 px-4 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-purple-900/20">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Deep Learning Music Composition System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Teach an AI to compose{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              expressive music
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            An end-to-end deep learning platform that walks you through collecting MIDI music, 
            extracting musical sequences with <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded text-sm">music21</code>, 
            training stacked LSTM networks, and synthesizing novel melodies directly in your browser.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('dataset')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm sm:text-base shadow-xl shadow-purple-600/30 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span>Start Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('generate')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-sm sm:text-base backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            >
              <Disc className="w-4 h-4 text-cyan-400" />
              <span>Listen to Generated Music</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-lg font-bold text-white">5-Step</div>
              <div className="text-xs text-slate-400">Complete ML Pipeline</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-lg font-bold text-purple-400">LSTM / RNN</div>
              <div className="text-xs text-slate-400">Recurrent Architecture</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-lg font-bold text-cyan-400">Tone.js</div>
              <div className="text-xs text-slate-400">Live Browser Audio</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-lg font-bold text-emerald-400">SMF Format 0</div>
              <div className="text-xs text-slate-400">Standard MIDI Export</div>
            </div>
          </div>

        </div>
      </section>

      {/* 5-Step Pipeline Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">The AI Music Pipeline</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Each stage is fully interactive and maps directly to the deep learning workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                onClick={() => onNavigate(step.id)}
                className="group p-6 rounded-3xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/50 backdrop-blur-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-purple-900/10"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-400/80">{step.num}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400">{step.tagline}</p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs font-semibold">
                  <span className={step.isDone ? "text-emerald-400 flex items-center gap-1" : "text-slate-500"}>
                    {step.isDone ? <><CheckCircle2 className="w-3.5 h-3.5" /> Complete</> : "Pending Action"}
                  </span>
                  <span className="text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open Step <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How LSTMs Learn Music Section */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/40 to-slate-900/80 border border-purple-800/30 backdrop-blur-xl space-y-6">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">How LSTMs Learn Musical Structure</h3>
              <p className="text-xs text-purple-300">Sequential memory, temporal dependencies, and tonality</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-purple-300 text-sm">1. Discrete Tokenization</h4>
              <p>
                Music is discretized into sequential tokens (pitches like <code>C4</code>, <code>G#5</code>, and polyphonic pitch-class chords like <code>0.4.7</code>). Rests provide rhythmic cadence.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-indigo-300 text-sm">2. Recurrent Memory Gates</h4>
              <p>
                Standard feedforward networks lack memory of previous notes. LSTMs maintain a cell state <code className="text-cyan-300">C_t</code> with input, forget, and output gates to preserve motifs over 100+ steps.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-cyan-300 text-sm">3. Temperature Sampling</h4>
              <p>
                The model outputs a categorical softmax distribution over the vocabulary. A temperature factor <code className="text-purple-300">T</code> scales log-odds: low values favor consonant structure, while higher values inspire improvisation.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
