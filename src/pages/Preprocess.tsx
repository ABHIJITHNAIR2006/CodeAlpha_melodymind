import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Play, 
  CheckCircle2, 
  Terminal, 
  BarChart2, 
  Hash, 
  Sliders, 
  ArrowRight,
  Music,
  Code2,
  RefreshCw
} from 'lucide-react';
import { PreprocessStatusResponse, api } from '../api';
import { useToast } from '../components/Toast';

interface PreprocessProps {
  onNavigateNext: () => void;
  onPreprocessComplete: () => void;
}

export const Preprocess: React.FC<PreprocessProps> = ({ onNavigateNext, onPreprocessComplete }) => {
  const { addToast } = useToast();

  const [sequenceLength, setSequenceLength] = useState<number>(100);
  const [transpose, setTranspose] = useState<boolean>(true);
  const [includeChords, setIncludeChords] = useState<boolean>(true);
  const [includeDurations, setIncludeDurations] = useState<boolean>(false);

  const [status, setStatus] = useState<PreprocessStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // Poll preprocessing status
  const fetchStatus = async () => {
    try {
      const data = await api.getPreprocessStatus();
      setStatus(data);
      if (data.completed && !data.is_running) {
        setIsPolling(false);
        onPreprocessComplete();
      }
    } catch (e) {
      console.warn("Could not fetch preprocess status", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    let timer: any;
    if (isPolling) {
      timer = setInterval(fetchStatus, 600);
    }
    return () => clearInterval(timer);
  }, [isPolling]);

  const handleStartPreprocessing = async () => {
    try {
      await api.startPreprocess({
        sequence_length: sequenceLength,
        transpose,
        include_chords: includeChords,
        include_durations: includeDurations
      });
      setIsPolling(true);
      addToast('info', 'Preprocessing Pipeline Started', 'Parsing tracks with music21 and constructing sliding windows...');
    } catch (err: any) {
      addToast('error', 'Execution Error', err.message);
    }
  };

  const stats = status?.stats;

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TASK 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Preprocess Music Sequences</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Tokenize raw MIDI streams with <code className="text-purple-300">music21</code>, normalize tonality, 
            encode chords as semitone pitch classes, and structure training tensors via sliding window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartPreprocessing}
            disabled={status?.is_running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {status?.is_running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Stream...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Preprocessing</span>
              </>
            )}
          </button>

          <button
            onClick={onNavigateNext}
            disabled={!stats}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Proceed to Model Architecture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preprocessing Controls & Sliders */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Extraction Parameters & Toggles</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sequence Length Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-medium">Sliding Window Sequence Length:</label>
              <span className="font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30">
                {sequenceLength} tokens
              </span>
            </div>
            <input
              type="range"
              min="32"
              max="200"
              step="4"
              value={sequenceLength}
              onChange={(e) => setSequenceLength(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Number of prior note tokens fed to the LSTM to predict the subsequent note.
            </p>
          </div>

          {/* Transpose Toggle */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <input
              type="checkbox"
              id="transpose"
              checked={transpose}
              onChange={(e) => setTranspose(e.target.checked)}
              className="mt-0.5 accent-purple-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <label htmlFor="transpose" className="text-xs font-semibold text-slate-200 cursor-pointer block">
                Transpose to C Major / A Minor
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Harmonic key normalization reduces token sparsity so the model learns relative intervals instead of absolute keys.
              </p>
            </div>
          </div>

          {/* Polyphonic Chords Toggle */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <input
              type="checkbox"
              id="includeChords"
              checked={includeChords}
              onChange={(e) => setIncludeChords(e.target.checked)}
              className="mt-0.5 accent-purple-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <label htmlFor="includeChords" className="text-xs font-semibold text-slate-200 cursor-pointer block">
                Include Polyphonic Chords
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Encodes simultaneous pitches as dot-joined pitch class tokens (e.g. <code>4.7.11</code>).
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Live Progress Bar & Console Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>music21 Execution Pipeline Log</span>
          </div>
          <span className="font-mono text-purple-300">
            {status?.is_running ? `Processing (${status.progress}%)` : status?.completed ? 'Complete' : 'Ready'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${status?.progress || 0}%` }}
          />
        </div>

        {/* Terminal Log Box */}
        <div className="h-36 rounded-2xl bg-slate-950 border border-slate-800/80 p-3 font-mono text-[11px] overflow-y-auto text-slate-300 space-y-1">
          {status?.logs && status.logs.length > 0 ? (
            status.logs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-purple-400">&gt;</span> {log}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">Click "Run Preprocessing" to begin stream parsing...</div>
          )}
        </div>
      </div>

      {/* Preprocessing Statistics Cards */}
      {stats && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Extracted Dataset Statistics</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xs text-slate-400 mb-1">Total Note Tokens</div>
              <div className="text-2xl font-bold text-white">{stats.total_tokens.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Across all tracks</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xs text-slate-400 mb-1">Vocabulary Size (Classes)</div>
              <div className="text-2xl font-bold text-purple-300">{stats.vocab_size}</div>
              <div className="text-[11px] text-slate-500 mt-1">Unique pitch & chord tokens</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xs text-slate-400 mb-1">Training Sequences</div>
              <div className="text-2xl font-bold text-cyan-300">{stats.num_sequences.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Window length {stats.sequence_length}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="text-xs text-slate-400 mb-1">Files Processed</div>
              <div className="text-2xl font-bold text-emerald-300">{stats.files_processed}</div>
              <div className="text-[11px] text-slate-500 mt-1">music21 parsed</div>
            </div>
          </div>

          {/* Top 20 Most Frequent Notes Histogram */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span>Top 20 Most Frequent Musical Tokens</span>
              </h3>
              <span className="text-[11px] text-slate-400">Class occurrence distribution</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {stats.top_notes.map((item, idx) => {
                const maxCount = stats.top_notes[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-end h-28 relative group">
                    <div className="w-full bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end h-16">
                      <div
                        className="bg-gradient-to-t from-purple-600 to-indigo-400 w-full rounded-md transition-all duration-300 group-hover:from-purple-500 group-hover:to-cyan-400"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-200 mt-1.5 truncate max-w-full">
                      {item.note}
                    </div>
                    <div className="text-[9px] font-mono text-purple-400">
                      {item.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Before & After Token Pipeline Demonstration */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Pipeline Transformation: Raw MIDI → Tokens → Integer Sequence</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-sans text-[11px] font-semibold">1. Raw MIDI Note Events</span>
                <div className="text-purple-300 text-[11px] break-words">
                  music21.note.Note(pitch="E5")<br/>
                  music21.note.Note(pitch="D#5")<br/>
                  music21.chord.Chord([C4, E4, G4])
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-sans text-[11px] font-semibold">2. Discrete Tokens (notes.pkl)</span>
                <div className="text-indigo-300 text-[11px] break-words">
                  {JSON.stringify(stats.sample_raw.slice(0, 6))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-sans text-[11px] font-semibold">3. Encoded Tensors (X, y)</span>
                <div className="text-cyan-300 text-[11px] break-words">
                  Input: {JSON.stringify(stats.sample_indices.slice(0, 5))}<br/>
                  Target: [{stats.sample_indices[5] ?? 0}]
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
