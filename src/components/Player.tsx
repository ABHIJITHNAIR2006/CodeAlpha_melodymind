import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Download, 
  Share2, 
  Sliders,
  Music2,
  Clock
} from 'lucide-react';
import { audioSynth } from '../audio/synth';

interface PlayerProps {
  tokens: string[];
  title?: string;
  tempo: number;
  instrument: string;
  midiDownloadUrl?: string;
  activeStep: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (step: number) => void;
  onChangeTempo: (bpm: number) => void;
  onChangeInstrument: (instrument: string) => void;
}

export const Player: React.FC<PlayerProps> = ({
  tokens,
  title = "AI Composition",
  tempo,
  instrument,
  midiDownloadUrl,
  activeStep,
  isPlaying,
  onTogglePlay,
  onStop,
  onSeek,
  onChangeTempo,
  onChangeInstrument
}) => {
  const [volume, setVolume] = useState<number>(-6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const totalSteps = tokens.length;
  const currentToken = activeStep >= 0 && activeStep < totalSteps ? tokens[activeStep] : "—";
  const secondsPerStep = (60 / tempo) * 0.5;
  const currentSeconds = Math.floor(Math.max(0, activeStep) * secondsPerStep);
  const totalSeconds = Math.floor(totalSteps * secondsPerStep);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (isMuted) setIsMuted(false);
    audioSynth.setVolume(val);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioSynth.setVolume(volume);
    } else {
      setIsMuted(true);
      audioSynth.setVolume(-80);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
      
      {/* Top track title & metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base leading-snug">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{instrument}</span>
              <span>•</span>
              <span>{tempo} BPM</span>
              <span>•</span>
              <span>{totalSteps} Notes</span>
            </div>
          </div>
        </div>

        {/* Note token readout badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Playing:</span>
            <span className="text-purple-300 font-bold px-1.5 py-0.5 bg-purple-500/20 rounded">
              {currentToken}
            </span>
          </div>

          {midiDownloadUrl && (
            <a
              href={midiDownloadUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              title="Download standard MIDI format (.mid) file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MIDI</span>
            </a>
          )}

          <button
            onClick={handleCopyShare}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Copy share link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Seek Slider */}
      <div className="space-y-1">
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden cursor-pointer group border border-slate-800"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const target = Math.floor(ratio * totalSteps);
            onSeek(target);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full transition-all duration-75 relative"
            style={{ width: `${totalSteps > 0 ? (Math.max(0, activeStep) / totalSteps) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-md" />
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
          <span>{formatTime(currentSeconds)}</span>
          <span className="text-slate-500">Step {activeStep >= 0 ? activeStep + 1 : 0} of {totalSteps}</span>
          <span>{formatTime(totalSeconds)}</span>
        </div>
      </div>

      {/* Control Buttons & Sliders */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        
        {/* Play/Pause/Stop */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            disabled={totalSteps === 0}
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play in browser"}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
          </button>

          <button
            onClick={onStop}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Stop and rewind"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Instrument Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium hidden sm:inline">Instrument:</label>
          <select
            value={instrument}
            onChange={(e) => onChangeInstrument(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Acoustic Grand Piano">Acoustic Grand Piano</option>
            <option value="Acoustic Guitar">Acoustic Guitar</option>
            <option value="Violin Ensemble">Violin / Strings</option>
            <option value="Flute Solo">Flute Solo</option>
            <option value="Synth Lead (Retro 80s)">Synth Lead (Retro 80s)</option>
          </select>
        </div>

        {/* Tempo Slider */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">BPM:</label>
          <input
            type="range"
            min="60"
            max="180"
            step="4"
            value={tempo}
            onChange={(e) => onChangeTempo(parseInt(e.target.value, 10))}
            className="w-20 accent-purple-500 cursor-pointer"
          />
          <span className="text-xs font-mono text-purple-300 w-8">{tempo}</span>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-slate-400 hover:text-slate-200">
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="-30"
            max="6"
            value={isMuted ? -80 : volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
            className="w-20 accent-purple-500 cursor-pointer"
          />
        </div>

      </div>

      {copied && (
        <div className="text-xs text-emerald-400 text-center font-mono">
          ✓ Link copied to clipboard
        </div>
      )}
    </div>
  );
};
