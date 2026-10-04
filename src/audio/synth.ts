/**
 * In-browser Web Audio / Tone.js synthesizer manager.
 * Provides polyphonic playback of note tokens and chords,
 * synchronized playback tracking, and instrument tone shaping.
 */

import * as Tone from 'tone';

export type NoteHighlightCallback = (noteIndex: number, noteToken: string) => void;
export type PlaybackStateChangeCallback = (isPlaying: boolean, progress: number) => void;

class MelodySynthEngine {
  private polySynth: Tone.PolySynth | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private currentTokens: string[] = [];
  private tempoBpm = 120;
  private currentStep = 0;
  private timeoutId: any = null;
  private onNoteHighlight: NoteHighlightCallback | null = null;
  private onStateChange: PlaybackStateChangeCallback | null = null;
  private volumeNode: Tone.Volume | null = null;

  async init() {
    if (this.isInitialized) return;
    try {
      await Tone.start();
      this.volumeNode = new Tone.Volume(-6).toDestination();

      this.polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.02,
          decay: 0.15,
          sustain: 0.4,
          release: 0.8
        }
      }).connect(this.volumeNode);

      this.polySynth.maxPolyphony = 16;
      this.isInitialized = true;
    } catch (e) {
      console.warn("Tone.js initialization deferred until first user interaction", e);
    }
  }

  setInstrument(instrument: string) {
    if (!this.polySynth) return;
    const lower = instrument.toLowerCase();

    if (lower.includes('guitar')) {
      this.polySynth.set({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.5 }
      });
    } else if (lower.includes('violin') || lower.includes('string')) {
      this.polySynth.set({
        oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
        envelope: { attack: 0.18, decay: 0.3, sustain: 0.8, release: 1.2 }
      });
    } else if (lower.includes('flute')) {
      this.polySynth.set({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.4 }
      });
    } else if (lower.includes('synth') || lower.includes('lead')) {
      this.polySynth.set({
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }
      });
    } else {
      // Acoustic Piano default
      this.polySynth.set({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.015, decay: 0.25, sustain: 0.35, release: 0.8 }
      });
    }
  }

  setVolume(decibels: number) {
    if (this.volumeNode) {
      this.volumeNode.volume.value = Math.max(-40, Math.min(6, decibels));
    }
  }

  setTempo(bpm: number) {
    this.tempoBpm = Math.max(40, Math.min(240, bpm));
  }

  setCallbacks(onHighlight: NoteHighlightCallback, onState: PlaybackStateChangeCallback) {
    this.onNoteHighlight = onHighlight;
    this.onStateChange = onState;
  }

  loadSequence(tokens: string[], bpm = 120, instrument = 'Acoustic Grand Piano') {
    this.stop();
    this.currentTokens = tokens;
    this.tempoBpm = bpm;
    this.setInstrument(instrument);
    this.currentStep = 0;
  }

  async play() {
    await this.init();
    if (this.currentTokens.length === 0) return;

    this.isPlaying = true;
    this.notifyState();
    this.scheduleNextStep();
  }

  pause() {
    this.isPlaying = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.polySynth) {
      this.polySynth.releaseAll();
    }
    this.notifyState();
  }

  stop() {
    this.pause();
    this.currentStep = 0;
    if (this.onNoteHighlight) {
      this.onNoteHighlight(-1, "");
    }
    this.notifyState();
  }

  seek(stepIndex: number) {
    this.currentStep = Math.max(0, Math.min(this.currentTokens.length - 1, stepIndex));
    this.notifyState();
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  private scheduleNextStep() {
    if (!this.isPlaying) return;

    if (this.currentStep >= this.currentTokens.length) {
      this.stop();
      return;
    }

    const token = this.currentTokens[this.currentStep];
    const stepDurationSec = (60 / this.tempoBpm) * 0.5; // eighth-note step

    // Play pitch or chord
    this.playToken(token, stepDurationSec * 0.9);

    if (this.onNoteHighlight) {
      this.onNoteHighlight(this.currentStep, token);
    }
    this.notifyState();

    this.currentStep++;
    this.timeoutId = setTimeout(() => {
      this.scheduleNextStep();
    }, stepDurationSec * 1000);
  }

  private playToken(token: string, durationSec: number) {
    if (!this.polySynth || !token || token.toUpperCase() === 'REST') return;

    try {
      if (token.includes('.')) {
        // Chord: either "0.4.7" pitch classes or note names
        const parts = token.split('.');
        const pitches: string[] = [];
        for (const p of parts) {
          if (/^\d+$/.test(p)) {
            const pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const pc = parseInt(p, 10);
            pitches.push(`${pitchClasses[pc % 12]}4`);
          } else {
            pitches.push(p);
          }
        }
        this.polySynth.triggerAttackRelease(pitches, durationSec);
      } else {
        // Single note
        this.polySynth.triggerAttackRelease(token, durationSec);
      }
    } catch (e) {
      // Skip unparseable pitch
    }
  }

  private notifyState() {
    if (this.onStateChange) {
      const progress = this.currentTokens.length > 0 ? this.currentStep / this.currentTokens.length : 0;
      this.onStateChange(this.isPlaying, progress);
    }
  }

  getStep(): number {
    return this.currentStep;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioSynth = new MelodySynthEngine();
