import React, { useEffect, useRef, useState } from 'react';
import { pitchNameToMidiNumber, midiNumberToPitchName } from '../server/midiEngine';

interface PianoRollProps {
  tokens: string[];
  activeStep: number;
  isPlaying: boolean;
  onSeekStep?: (step: number) => void;
  height?: number;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  tokens,
  activeStep,
  isPlaying,
  onSeekStep,
  height = 240
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  // Parse notes with pitches & steps
  interface NoteRect {
    step: number;
    pitch: number;
    pitchName: string;
    isChord: boolean;
  }

  const notes: NoteRect[] = [];
  let minPitch = 60;
  let maxPitch = 72;

  tokens.forEach((token, step) => {
    if (!token || token.toUpperCase() === 'REST') return;

    if (token.includes('.')) {
      const parts = token.split('.');
      parts.forEach((p) => {
        let pitch = 60;
        if (/^\d+$/.test(p)) {
          pitch = (4 + 1) * 12 + parseInt(p, 10);
        } else {
          pitch = pitchNameToMidiNumber(p);
        }
        notes.push({ step, pitch, pitchName: midiNumberToPitchName(pitch), isChord: true });
        minPitch = Math.min(minPitch, pitch);
        maxPitch = Math.max(maxPitch, pitch);
      });
    } else {
      const pitch = pitchNameToMidiNumber(token);
      notes.push({ step, pitch, pitchName: token, isChord: false });
      minPitch = Math.min(minPitch, pitch);
      maxPitch = Math.max(maxPitch, pitch);
    }
  });

  // Add padding to pitch bounds
  minPitch = Math.max(24, minPitch - 2);
  maxPitch = Math.min(108, maxPitch + 2);
  const totalPitchRange = Math.max(12, maxPitch - minPitch + 1);

  // Render on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    const keyLaneWidth = 42;
    const rollWidth = width - keyLaneWidth;
    const totalSteps = Math.max(30, tokens.length);
    const stepWidth = Math.max(12, rollWidth / totalSteps);
    const pitchHeight = canvasHeight / totalPitchRange;

    ctx.clearRect(0, 0, width, canvasHeight);

    // 1. Draw pitch background grid
    for (let p = minPitch; p <= maxPitch; p++) {
      const pitchClass = p % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(pitchClass);
      const y = canvasHeight - (p - minPitch + 1) * pitchHeight;

      ctx.fillStyle = isBlackKey ? '#0f172a' : '#1e293b88';
      ctx.fillRect(keyLaneWidth, y, rollWidth, pitchHeight);

      // Horizontal grid line
      ctx.strokeStyle = '#33415544';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(keyLaneWidth, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Draw Key lane indicator on left
      ctx.fillStyle = isBlackKey ? '#090d16' : '#1e293b';
      ctx.fillRect(0, y, keyLaneWidth, pitchHeight);

      if (pitchClass === 0 || p === minPitch || p === maxPitch) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(midiNumberToPitchName(p), 4, y + pitchHeight - 3);
      }
    }

    // 2. Draw vertical step bar lines (every 4 or 8 steps)
    for (let s = 0; s <= totalSteps; s++) {
      const x = keyLaneWidth + s * stepWidth;
      const isMeasure = s % 8 === 0;
      const isBeat = s % 4 === 0;

      ctx.strokeStyle = isMeasure ? '#64748b66' : isBeat ? '#47556944' : '#33415522';
      ctx.lineWidth = isMeasure ? 1.5 : 0.75;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // 3. Draw note blocks
    notes.forEach((note) => {
      const x = keyLaneWidth + note.step * stepWidth;
      const y = canvasHeight - (note.pitch - minPitch + 1) * pitchHeight;
      const w = Math.max(8, stepWidth - 2);
      const h = Math.max(4, pitchHeight - 2);
      const isActive = note.step === activeStep;

      // Color by pitch or chord
      if (isActive) {
        // Glowing active note
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
      } else if (note.isChord) {
        ctx.fillStyle = '#c084fc'; // purple chord
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else {
        // Gradient tone
        ctx.fillStyle = '#818cf8'; // indigo melody
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, w, h, 2);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = isActive ? '#ffffff' : '#a5b4fc44';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;
    });

    // 4. Draw Playhead
    if (activeStep >= 0 && activeStep < totalSteps) {
      const playheadX = keyLaneWidth + activeStep * stepWidth;
      // Head line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvasHeight);
      ctx.stroke();

      // Top indicator triangle
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 9);
      ctx.closePath();
      ctx.fill();
    }
  }, [tokens, activeStep, isPlaying, minPitch, maxPitch, totalPitchRange]);

  // Handle click to seek
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeekStep || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const keyLaneWidth = 42;
    if (x < keyLaneWidth) return;

    const rollWidth = rect.width - keyLaneWidth;
    const totalSteps = Math.max(30, tokens.length);
    const stepRatio = (x - keyLaneWidth) / rollWidth;
    const targetStep = Math.floor(stepRatio * totalSteps);
    onSeekStep(Math.max(0, Math.min(tokens.length - 1, targetStep)));
  };

  return (
    <div ref={containerRef} className="w-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="font-semibold text-slate-300">Interactive Piano Roll</span>
          <span className="text-slate-500">|</span>
          <span>{notes.length} Active Notes</span>
          <span className="text-slate-500">|</span>
          <span>Pitch Range: {midiNumberToPitchName(minPitch)} - {midiNumberToPitchName(maxPitch)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-400" />
            <span>Melody</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-400" />
            <span>Chords</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <span>Active Hit</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={900}
          height={height}
          onClick={handleCanvasClick}
          className="w-full block"
        />
      </div>
    </div>
  );
};
