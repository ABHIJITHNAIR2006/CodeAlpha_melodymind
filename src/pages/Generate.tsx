import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  HelpCircle, 
  Download, 
  Share2, 
  Layers, 
  Music, 
  Clock, 
  RefreshCw, 
  Check, 
  Disc,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GenerationItem, api } from '../api';
import { PianoRoll } from '../components/PianoRoll';
import { Player } from '../components/Player';
import { audioSynth } from '../audio/synth';
import { useToast } from '../components/Toast';

export const Generate: React.FC = () => {
  const { addToast } = useToast();

  // Generator parameters
  const [numNotes, setNumNotes] = useState<number>(120);
  const [temperature, setTemperature] = useState<number>(0.85);
  const [tempo, setTempo] = useState<number>(128);
  const [instrument, setInstrument] = useState<string>('Acoustic Grand Piano');
  const [seedChoice, setSeedChoice] = useState<string>('random');

  // Generator state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<GenerationItem | null>(null);
  const [variations, setVariations] = useState<GenerationItem[]>([]);
  const [history, setHistory] = useState<GenerationItem[]>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  // Load history on mount
  const loadHistory = async () => {
    try {
      const data = await api.getOutputs();
      setHistory(data.outputs);
      if (data.outputs.length > 0 && !currentTrack) {
        setCurrentTrack(data.outputs[0]);
      }
    } catch (e) {
      console.warn("Could not load outputs", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Sync synth callbacks
  useEffect(() => {
    audioSynth.setCallbacks(
      (step) => setActiveStep(step),
      (playing) => setIsPlaying(playing)
    );
  }, []);

  // Update track in synth when track changes
  useEffect(() => {
    if (currentTrack) {
      audioSynth.loadSequence(currentTrack.tokens, currentTrack.tempo, currentTrack.instrument);
      setActiveStep(0);
    }
  }, [currentTrack]);

  const getSeedTokens = () => {
    if (seedChoice === 'beethoven') {
      return ["E5", "D#5", "E5", "D#5", "E5", "B4", "D5", "C5", "A4"];
    }
    if (seedChoice === 'jazz') {
      return ["Bb3", "D4", "F4", "Ab4", "G4", "F4", "D4", "F4"];
    }
    if (seedChoice === 'bach') {
      return ["D5", "G4", "A4", "B4", "C5", "D5", "G4", "G4"];
    }
    return undefined;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await api.generateMusic({
        num_notes: numNotes,
        temperature,
        tempo,
        instrument,
        custom_seed: getSeedTokens()
      });
      setCurrentTrack(result);
      setHistory((prev) => [result, ...prev]);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      addToast('success', 'Composition Generated', `Synthesized ${result.num_notes} notes at temperature ${temperature}.`);
    } catch (err: any) {
      addToast('error', 'Generation Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVariations = async () => {
    setIsGeneratingVariations(true);
    try {
      const res = await api.generateVariations({
        num_notes: 80,
        tempo,
        instrument
      });
      setVariations(res.variations);
      setHistory((prev) => [...res.variations, ...prev]);
      if (res.variations.length > 0) {
        setCurrentTrack(res.variations[1] || res.variations[0]);
      }
      addToast('success', '3 Variations Ready', 'Generated conservative, balanced, and creative temperature variations.');
    } catch (err: any) {
      addToast('error', 'Variations Failed', err.message);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioSynth.pause();
    } else {
      await audioSynth.play();
    }
  };

  const handleStop = () => {
    audioSynth.stop();
  };

  const handleSeek = (step: number) => {
    audioSynth.seek(step);
    setActiveStep(step);
  };

  const handleSelectTrack = (track: GenerationItem) => {
    audioSynth.stop();
    setCurrentTrack(track);
  };

  const getTemperatureDescription = (temp: number) => {
    if (temp < 0.5) return "Very structured & consonant. Minimal surprises, tightly adheres to major triad & scale degrees.";
    if (temp <= 0.95) return "Balanced musical phrasing. Smooth voice leading with occasional leaps and rhythmic cadence.";
    if (temp <= 1.4) return "Adventurous & expressive. Chromatic embellishments, unusual intervals, and unexpected chords.";
    return "High entropy / Avant-Garde. Highly randomized and experimental musical exploration.";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TASK 5
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Generate & Play Music</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Sample new sequences autoregressively from the trained LSTM. Audition on the live piano-roll visualizer, download standard MIDI, and compare temperature variations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateVariations}
            disabled={isGeneratingVariations}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Generate 3 tracks at T=0.4, 0.85, 1.4 for side-by-side comparison"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingVariations ? 'Composing 3 Variations...' : 'Compare 3 Variations'}</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sampling Tensors...</span>
              </>
            ) : (
              <>
                <Disc className="w-3.5 h-3.5" />
                <span>Generate Music</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generation Parameters Form */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Generative Controls & Temperature Slider</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>Temperature (Randomness):</span>
              </span>
              <span className="font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30">
                T = {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.8"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              {getTemperatureDescription(temperature)}
            </p>
          </div>

          {/* Number of Notes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-medium">Sequence Length:</label>
              <span className="font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30">
                {numNotes} notes
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="500"
              step="10"
              value={numNotes}
              onChange={(e) => setNumNotes(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Approx. {Math.round(numNotes * (60 / tempo) * 0.5)}s duration at {tempo} BPM.
            </p>
          </div>

          {/* Seed Motif Selection */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Seed Initial Motif:</label>
            <select
              value={seedChoice}
              onChange={(e) => setSeedChoice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="random">Random Slice from Dataset</option>
              <option value="beethoven">Für Elise Motif (Beethoven)</option>
              <option value="jazz">Blues Walking Bass (Thelonious Monk)</option>
              <option value="bach">Minuet Motif (J. S. Bach)</option>
            </select>
            <p className="text-[11px] text-slate-500">The priming sequence fed to start generation.</p>
          </div>

          {/* Instrument Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Instrument Timbre:</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="Acoustic Grand Piano">Acoustic Grand Piano (GM 0)</option>
              <option value="Acoustic Guitar">Acoustic Guitar (GM 24)</option>
              <option value="Violin Ensemble">Violin / Strings (GM 40)</option>
              <option value="Flute Solo">Flute Solo (GM 73)</option>
              <option value="Synth Lead (Retro 80s)">Synth Lead (Retro 80s)</option>
            </select>
            <p className="text-[11px] text-slate-500">Rendered in-browser with Tone.js.</p>
          </div>

        </div>
      </div>

      {/* Side-by-side Variations Comparison (if generated) */}
      {variations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Temperature Variations Comparison (Side-by-Side)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {variations.map((v) => {
              const isSelected = currentTrack?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => handleSelectTrack(v)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500/60 shadow-lg shadow-purple-900/20'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{v.variation_label}</span>
                    <span className="font-mono text-[10px] text-purple-300">T={v.temperature}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {getTemperatureDescription(v.temperature)}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <span className="font-mono text-slate-400">{v.num_notes} notes</span>
                    <span className="text-purple-400 font-semibold flex items-center gap-1">
                      {isSelected ? 'Currently Playing' : 'Select Track'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Player & Interactive Piano Roll */}
      {currentTrack ? (
        <div className="space-y-6">
          <Player
            tokens={currentTrack.tokens}
            title={currentTrack.title}
            tempo={currentTrack.tempo}
            instrument={currentTrack.instrument}
            midiDownloadUrl={api.getMidiDownloadUrl(currentTrack.id)}
            activeStep={activeStep}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            onSeek={handleSeek}
            onChangeTempo={(newTempo) => {
              audioSynth.setTempo(newTempo);
              setCurrentTrack({ ...currentTrack, tempo: newTempo });
            }}
            onChangeInstrument={(newInstr) => {
              audioSynth.setInstrument(newInstr);
              setCurrentTrack({ ...currentTrack, instrument: newInstr });
            }}
          />

          <PianoRoll
            tokens={currentTrack.tokens}
            activeStep={activeStep}
            isPlaying={isPlaying}
            onSeekStep={handleSeek}
            height={260}
          />
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
          <Disc className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
          <p className="text-sm">No composition active. Click "Generate Music" above to synthesize your first track!</p>
        </div>
      )}

      {/* Generation History List */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Generation History</span>
            <span className="text-xs font-mono text-slate-400">({history.length})</span>
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Temp (T)</th>
                  <th className="py-3 px-4">Tempo</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => {
                  const isCurrent = currentTrack?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleSelectTrack(item)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent ? 'bg-purple-950/40' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                        <span>{item.title}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-300">{item.num_notes}</td>
                      <td className="py-3 px-4 font-mono text-cyan-300">{item.temperature}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{item.tempo} BPM</td>
                      <td className="py-3 px-4 text-slate-300">{item.instrument}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{item.duration_sec}s</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={api.getMidiDownloadUrl(item.id)}
                          download
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                          title="Download MIDI file"
                        >
                          <Download className="w-3 h-3" />
                          <span>.MID</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
