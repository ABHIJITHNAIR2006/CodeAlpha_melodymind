/**
 * Binary Standard MIDI File (SMF Format 0) encoder and decoder.
 * Produces valid .mid files playable in any DAW, media player, or browser synth.
 */

export interface NoteEvent {
  pitch: number;      // MIDI pitch 0-127 (60 = C4)
  noteName: string;   // e.g. "C4", "G#5"
  timeOffset: number; // in beats / quarter notes (0.0, 0.5, 1.0...)
  duration: number;   // in beats (e.g. 0.5 for eighth note, 1.0 for quarter)
  velocity?: number;
}

export function writeVarLength(value: number): number[] {
  let buffer = [value & 0x7f];
  while ((value >>= 7)) {
    buffer.unshift((value & 0x7f) | 0x80);
  }
  return buffer;
}

export function pitchNameToMidiNumber(name: string): number {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const cleaned = name.trim();
  // Normalize flats
  const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  let normalized = cleaned;
  for (const [flat, sharp] of Object.entries(flatMap)) {
    if (normalized.startsWith(flat)) {
      normalized = sharp + normalized.slice(flat.length);
      break;
    }
  }

  let letter = normalized[0];
  let octaveStr = normalized.slice(1);
  if (normalized.length >= 2 && (normalized[1] === '#' || normalized[1] === 'b')) {
    letter = normalized.slice(0, 2);
    octaveStr = normalized.slice(2);
  }
  const octave = parseInt(octaveStr, 10);
  const safeOctave = isNaN(octave) ? 4 : octave;
  const idx = notes.indexOf(letter);
  const pitchClass = idx !== -1 ? idx : 0;
  return Math.min(127, Math.max(0, (safeOctave + 1) * 12 + pitchClass));
}

export function midiNumberToPitchName(pitch: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const note = notes[pitch % 12];
  return `${note}${octave}`;
}

export function encodeTokensToMidiBytes(
  tokens: string[],
  tempoBpm: number = 120,
  instrumentNumber: number = 0,
  stepOffset: number = 0.5
): Uint8Array {
  const ticksPerQuarter = 480;
  const trackBytes: number[] = [];

  // Track Name
  const trackName = "MelodyMind AI Composition";
  trackBytes.push(0x00, 0xff, 0x03, trackName.length);
  for (let i = 0; i < trackName.length; i++) {
    trackBytes.push(trackName.charCodeAt(i));
  }

  // Set Tempo (microseconds per quarter note = 60,000,000 / BPM)
  const mpqn = Math.round(60000000 / tempoBpm);
  trackBytes.push(0x00, 0xff, 0x51, 0x03);
  trackBytes.push((mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);

  // Set Instrument / Program Change (0 = Piano, 24 = Guitar, 40 = Violin, 73 = Flute, etc.)
  trackBytes.push(0x00, 0xc0, instrumentNumber & 0x7f);

  // Convert tokens into timed on/off events
  interface RawEvent {
    tick: number;
    type: 'on' | 'off';
    pitch: number;
    velocity: number;
  }
  const rawEvents: RawEvent[] = [];
  let currentBeat = 0.0;

  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed.toUpperCase() === 'REST') {
      currentBeat += stepOffset;
      continue;
    }

    const startTick = Math.round(currentBeat * ticksPerQuarter);
    const durationTicks = Math.round(stepOffset * 0.92 * ticksPerQuarter); // slightly staccato for clarity
    const endTick = startTick + durationTicks;

    if (trimmed.includes('.')) {
      // Chord
      const parts = trimmed.split('.');
      for (const p of parts) {
        let pitch = 60;
        if (/^\d+$/.test(p)) {
          pitch = (4 + 1) * 12 + parseInt(p, 10);
        } else {
          pitch = pitchNameToMidiNumber(p);
        }
        rawEvents.push({ tick: startTick, type: 'on', pitch, velocity: 85 });
        rawEvents.push({ tick: endTick, type: 'off', pitch, velocity: 64 });
      }
    } else {
      // Single Note
      const pitch = pitchNameToMidiNumber(trimmed);
      rawEvents.push({ tick: startTick, type: 'on', pitch, velocity: 90 });
      rawEvents.push({ tick: endTick, type: 'off', pitch, velocity: 64 });
    }

    currentBeat += stepOffset;
  }

  // Sort events by tick (with off before on at same tick)
  rawEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === 'off' && b.type === 'on') return -1;
    if (a.type === 'on' && b.type === 'off') return 1;
    return 0;
  });

  // Write delta-times and MIDI messages
  let lastTick = 0;
  for (const ev of rawEvents) {
    const delta = ev.tick - lastTick;
    lastTick = ev.tick;
    const deltaBytes = writeVarLength(delta);
    trackBytes.push(...deltaBytes);

    if (ev.type === 'on') {
      trackBytes.push(0x90, ev.pitch & 0x7f, ev.velocity & 0x7f);
    } else {
      trackBytes.push(0x80, ev.pitch & 0x7f, ev.velocity & 0x7f);
    }
  }

  // End of Track Meta Event
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Assemble full SMF Format 0 file
  const header = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x00,             // Format 0 (single track)
    0x00, 0x01,             // 1 track
    (ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff // Division
  ];

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    (trackBytes.length >> 24) & 0xff,
    (trackBytes.length >> 16) & 0xff,
    (trackBytes.length >> 8) & 0xff,
    trackBytes.length & 0xff
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackBytes]);
}

export function encodeTokensToMidiBuffer(
  tokens: string[],
  tempoBpm: number = 120,
  instrumentNumber: number = 0,
  stepOffset: number = 0.5
): Uint8Array {
  return encodeTokensToMidiBytes(tokens, tempoBpm, instrumentNumber, stepOffset);
}

/**
 * Direct browser download of MIDI bytes without requiring backend round-trip
 */
export function triggerBrowserMidiDownload(
  tokens: string[],
  filename: string = 'melodymind_composition.mid',
  tempo: number = 120,
  instrument: string = 'Acoustic Grand Piano'
) {
  const instrumentNumber = instrument.toLowerCase().includes('guitar') ? 24 :
    instrument.toLowerCase().includes('violin') ? 40 :
    instrument.toLowerCase().includes('flute') ? 73 : 0;

  const bytes = encodeTokensToMidiBytes(tokens, tempo, instrumentNumber, 0.5);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
