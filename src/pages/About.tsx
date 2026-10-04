import React from 'react';
import { 
  FileText, 
  Printer, 
  BookOpen, 
  Layers, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  GitBranch,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../components/Toast';

export const About: React.FC = () => {
  const { addToast } = useToast();

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-10 pb-20 print:p-0 print:text-black">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 print:border-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 print:hidden">
              DOCUMENTATION & REPORT
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
              MelodyMind Project Report
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 print:text-gray-600 mt-1">
            Methodology, Neural Architecture Specifications, Dataset Provenance, and Experimental Results
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer print:hidden"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Download / Print Report</span>
        </button>
      </div>

      {/* 1. Executive Summary */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400 print:text-black" />
          <span>1. Executive Summary & Objective</span>
        </h2>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2 print:bg-white print:border-gray-300 print:text-black">
          <p>
            <strong>MelodyMind</strong> is an end-to-end machine learning system that learns musical structure and voice-leading rules directly from symbolic MIDI data. By encoding pitch, harmony, and rhythm into discrete sequential tokens, the system trains deep recurrent neural networks (stacked LSTMs) to predict subsequent musical events given a sliding context window of past notes.
          </p>
          <p>
            The project satisfies all five requirements of AI Music Generation: (1) multi-track MIDI dataset ingestion, (2) tonality-invariant preprocessing with <code className="text-purple-300 print:text-black">music21</code>, (3) modular LSTM and GAN deep learning architectures, (4) background training with real-time loss telemetry, and (5) temperature-controlled autoregressive sampling with standard MIDI binary export and browser synthesis.
          </p>
        </div>
      </section>

      {/* 2. End-to-End Pipeline Architecture Diagram */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-400 print:text-black" />
          <span>2. Pipeline Methodology Diagram</span>
        </h2>
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 print:bg-white print:border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 print:bg-gray-100 print:border-gray-400">
              <div className="font-bold text-purple-400 print:text-black">Input MIDI</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">SMF Format 0/1 (.mid)</div>
              <div className="text-[9px] text-slate-500">Tracks & delta times</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 print:bg-gray-100 print:border-gray-400">
              <div className="font-bold text-indigo-400 print:text-black">music21 Parsing</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">Stream Flattening</div>
              <div className="text-[9px] text-slate-500">Key transpose to C</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 print:bg-gray-100 print:border-gray-400">
              <div className="font-bold text-cyan-400 print:text-black">Sliding Window</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">L = 100 Tokens</div>
              <div className="text-[9px] text-slate-500">X[t...t+L] → y[t+L+1]</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 print:bg-gray-100 print:border-gray-400">
              <div className="font-bold text-amber-400 print:text-black">Stacked LSTM</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">3x 256 Units + Dropout</div>
              <div className="text-[9px] text-slate-500">Softmax Cross-Entropy</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 print:bg-gray-100 print:border-gray-400">
              <div className="font-bold text-emerald-400 print:text-black">Sampling & Audio</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">Temperature Scaling</div>
              <div className="text-[9px] text-slate-500">Tone.js & SMF Binary</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mathematical Formulation */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400 print:text-black" />
          <span>3. Mathematical Formulation</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-white print:border-gray-300">
            <h3 className="font-bold text-purple-300 print:text-black">LSTM Cell Transitions</h3>
            <p className="text-slate-400 print:text-gray-700 leading-relaxed font-mono text-[11px]">
              f_t = σ(W_f · [h_t-1, x_t] + b_f)  (Forget Gate)<br/>
              i_t = σ(W_i · [h_t-1, x_t] + b_i)  (Input Gate)<br/>
              C̃_t = tanh(W_c · [h_t-1, x_t] + b_c)<br/>
              C_t = f_t * C_t-1 + i_t * C̃_t       (Cell State Update)<br/>
              o_t = σ(W_o · [h_t-1, x_t] + b_o)  (Output Gate)<br/>
              h_t = o_t * tanh(C_t)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-white print:border-gray-300">
            <h3 className="font-bold text-cyan-300 print:text-black">Temperature-Scaled Multinomial Sampling</h3>
            <p className="text-slate-400 print:text-gray-700 leading-relaxed font-mono text-[11px]">
              q_i = log(p_i) / Temperature<br/>
              P(next = token_i) = exp(q_i) / Σ_j exp(q_j)<br/>
              <span className="font-sans text-[11px] text-slate-400 print:text-gray-600 block mt-2">
                As T → 0, sampling becomes deterministic argmax (greedy decoding). As T increases, entropy expands, allowing exploratory musical embellishments.
              </span>
            </p>
          </div>

        </div>
      </section>

      {/* 4. Dataset Provenance & Licenses */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-black" />
          <span>4. Dataset Sources & Licenses</span>
        </h2>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2 print:bg-white print:border-gray-300 print:text-black">
          <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
            <li>
              <strong>Ludwig van Beethoven:</strong> Bagatelle No. 25 in A minor ("Für Elise"), WoO 59. Public Domain.
            </li>
            <li>
              <strong>Wolfgang Amadeus Mozart:</strong> Serenade No. 13 for strings in G major ("Eine kleine Nachtmusik"), K. 525. Public Domain.
            </li>
            <li>
              <strong>Johann Sebastian Bach:</strong> Minuet in G major, BWV Anh. 114 (Notebook for Anna Magdalena Bach). Public Domain.
            </li>
            <li>
              <strong>Jazz Standard Progressions:</strong> Modal ii-V-I progressions and 12-bar blues syncopations (Autumn Leaves motif and Thelonious Monk harmonic turns). Educational use.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Limitations & Future Work */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 print:text-black" />
          <span>5. Limitations & Future Enhancements</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-white print:border-gray-300">
            <h3 className="font-bold text-amber-300 print:text-black">Current System Limitations</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 print:text-gray-700">
              <li>LSTMs struggle to maintain global song form (sonata or AABA structure) over 500+ measures without attention mechanisms.</li>
              <li>Micro-timing dynamics (velocity variations, swing, rubato) are quantized to eighth-note grids.</li>
              <li>Polyphony is simplified into unified chord tokens rather than multi-voice counterpoint.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-white print:border-gray-300">
            <h3 className="font-bold text-purple-300 print:text-black">Recommended Future Directions</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 print:text-gray-700">
              <li><strong>Music Transformer (Huang et al.):</strong> Self-attention with relative position representations for long-range musical coherence.</li>
              <li><strong>MuseGAN (Dong et al.):</strong> Multi-track convolutional GANs for simultaneous drum, bass, and piano arrangement.</li>
              <li><strong>DiffWave & Audio Latent Diffusion:</strong> End-to-end direct waveform synthesis.</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 6. References */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400 print:text-black" />
          <span>6. Selected Academic References</span>
        </h2>
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1.5 print:bg-white print:border-gray-300 print:text-black">
          <div>[1] Hochreiter, S., & Schmidhuber, J. (1997). Long short-term memory. <em>Neural Computation</em>, 9(8), 1735-1780.</div>
          <div>[2] Cuthbert, M. S., & Ariza, C. (2010). music21: A Toolkit for Computer-Aided Musicology and Symbolic Music Data. <em>ISMIR</em>.</div>
          <div>[3] Huang, C. Z. A., et al. (2018). Music Transformer: Generating Music with Long-Term Structure. <em>ICLR</em>.</div>
          <div>[4] Dong, H. W., et al. (2018). MuseGAN: Multi-track Sequential Generative Adversarial Networks for Symbolic Music Generation. <em>AAAI</em>.</div>
        </div>
      </section>

    </div>
  );
};
